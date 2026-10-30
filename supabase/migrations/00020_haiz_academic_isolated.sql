-- HAIZ Academic data layer for GD's existing Supabase project.
-- Creates ONLY haiz_* objects. Never changes GD's profiles, orders or game RPCs.
-- Apply in a controlled Supabase SQL migration AFTER reviewing RLS.

create table if not exists public.haiz_user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('student','teacher','admin')) default 'student',
  created_at timestamptz not null default now()
);
create table if not exists public.haiz_classes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 80),
  teacher_id uuid not null references auth.users(id),
  join_code text unique not null default left(replace(gen_random_uuid()::text,'-',''),16),
  created_at timestamptz not null default now()
);
create table if not exists public.haiz_memberships (
  class_id uuid not null references public.haiz_classes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check(status in ('pending','active','rejected')),
  created_at timestamptz not null default now(),
  primary key (class_id,user_id)
);
create table if not exists public.haiz_assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.haiz_classes(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  subject text not null check (char_length(trim(subject)) between 1 and 50),
  title text not null check (char_length(trim(title)) between 1 and 240),
  due date,
  status text not null default 'published' check (status in ('published','withdrawn')),
  version integer not null default 1 check(version >= 1),
  created_at timestamptz not null default now()
);
create table if not exists public.haiz_screen_secrets (
  class_id uuid primary key references public.haiz_classes(id) on delete cascade,
  secret_hash text not null unique check (secret_hash ~ '^[0-9a-f]{32}$'),
  rotated_at timestamptz not null default now()
);
create index if not exists haiz_member_user_idx on public.haiz_memberships(user_id,status);
create index if not exists haiz_assignment_class_idx on public.haiz_assignments(class_id,created_at desc);

alter table public.haiz_user_roles enable row level security;
alter table public.haiz_classes enable row level security;
alter table public.haiz_memberships enable row level security;
alter table public.haiz_assignments enable row level security;
alter table public.haiz_screen_secrets enable row level security;

-- Supabase projects can grant broad default privileges to public tables:
-- remove them, then explicitly restore only necessary operations.
revoke all on public.haiz_user_roles, public.haiz_classes,
  public.haiz_memberships, public.haiz_assignments,
  public.haiz_screen_secrets from public, anon, authenticated;
grant select on public.haiz_user_roles to authenticated;
grant select, insert on public.haiz_classes to authenticated;
grant select, update(status) on public.haiz_memberships to authenticated;
grant select, insert, update(subject,title,due,status) on public.haiz_assignments to authenticated;

-- SECURITY DEFINER helpers break recursive policies and are deliberately
-- read-only. The caller identity comes from auth.uid(), never user metadata.
create or replace function public.haiz_is_teacher(p_class_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1 from public.haiz_classes c
    where c.id = p_class_id and c.teacher_id = auth.uid()
  );
$$;
create or replace function public.haiz_is_member(p_class_id uuid, p_include_pending boolean default false)
returns boolean language sql stable security definer set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1 from public.haiz_memberships m
    where m.class_id = p_class_id and m.user_id = auth.uid()
      and (m.status='active' or (p_include_pending and m.status='pending'))
  );
$$;

create policy haiz_role_self on public.haiz_user_roles
  for select to authenticated using (user_id = (select auth.uid()));
create policy haiz_class_read on public.haiz_classes
  for select to authenticated using (
    (select public.haiz_is_teacher(id)) or (select public.haiz_is_member(id,true))
  );
create policy haiz_class_teacher_create on public.haiz_classes
  for insert to authenticated with check (
    teacher_id=(select auth.uid())
    and exists (select 1 from public.haiz_user_roles r
                where r.user_id=(select auth.uid()) and r.role in ('teacher','admin'))
  );
create policy haiz_membership_read on public.haiz_memberships
  for select to authenticated using (
    user_id=(select auth.uid()) or (select public.haiz_is_teacher(class_id))
  );
create policy haiz_membership_teacher_approve on public.haiz_memberships
  for update to authenticated
  using ((select public.haiz_is_teacher(class_id)))
  with check ((select public.haiz_is_teacher(class_id)));
create policy haiz_assignment_read on public.haiz_assignments
  for select to authenticated using (
    (select public.haiz_is_teacher(class_id))
    or (status='published' and (select public.haiz_is_member(class_id,false)))
  );
create policy haiz_assignment_teacher_create on public.haiz_assignments
  for insert to authenticated with check (
    author_id=(select auth.uid()) and (select public.haiz_is_teacher(class_id))
  );
create policy haiz_assignment_teacher_update on public.haiz_assignments
  for update to authenticated
  using ((select public.haiz_is_teacher(class_id)))
  with check ((select public.haiz_is_teacher(class_id)));

-- New HAIZ users are ALWAYS assigned the student role. There is no
-- client-callable teacher/admin promotion operation.
create or replace function public.haiz_ensure_student()
returns text language plpgsql security definer set search_path = ''
as $$
declare v_role text;
begin
  if auth.uid() is null then raise exception 'LOGIN_REQUIRED'; end if;
  insert into public.haiz_user_roles(user_id,role)
    values(auth.uid(),'student') on conflict (user_id) do nothing;
  select role into v_role from public.haiz_user_roles where user_id=auth.uid();
  return v_role;
end;
$$;

-- Students can request a join only with a valid invite. No direct insert
-- privileges on haiz_memberships are granted to browser clients.
create or replace function public.haiz_request_join(p_code text)
returns text language plpgsql security definer set search_path = ''
as $$
declare v_class uuid; v_role text; v_status text;
begin
  if auth.uid() is null then raise exception 'LOGIN_REQUIRED'; end if;
  select role into v_role from public.haiz_user_roles where user_id=auth.uid();
  if v_role is distinct from 'student' then raise exception 'STUDENTS_ONLY'; end if;
  if p_code is null or p_code !~ '^[0-9a-f]{16}$' then
    raise exception 'INVALID_INVITE';
  end if;
  select id into v_class from public.haiz_classes where join_code=p_code;
  if v_class is null then raise exception 'INVALID_INVITE'; end if;
  insert into public.haiz_memberships(class_id,user_id,status)
    values(v_class,auth.uid(),'pending')
    on conflict(class_id,user_id) do update
    set status=case when public.haiz_memberships.status='active' then 'active' else 'pending' end;
  select status into v_status from public.haiz_memberships
   where class_id=v_class and user_id=auth.uid();
  return v_status;
end;
$$;

-- 96-char unpredictable token; only an authorized teacher can rotate it.
-- The raw token is returned once and NEVER saved in the database.
create or replace function public.haiz_rotate_screen_key(p_class_id uuid)
returns text language plpgsql security definer set search_path = ''
as $$
declare v_key text;
begin
  if not public.haiz_is_teacher(p_class_id) then raise exception 'FORBIDDEN'; end if;
  v_key := md5(gen_random_uuid()::text || gen_random_uuid()::text)
        || md5(gen_random_uuid()::text || gen_random_uuid()::text)
        || md5(gen_random_uuid()::text || gen_random_uuid()::text);
  insert into public.haiz_screen_secrets(class_id,secret_hash)
  values(p_class_id,md5(v_key))
  on conflict (class_id) do update
    set secret_hash=excluded.secret_hash, rotated_at=now();
  return v_key;
end;
$$;

-- Public read-only feed: requires the exact 96-char secret, exposes only
-- class title and approved assignments. No names, membership or progress.
create or replace function public.haiz_screen_feed(p_key text)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare v_class uuid; v_name text; v_assignments jsonb;
begin
  if p_key is null or p_key !~ '^[0-9a-f]{96}$' then
    return jsonb_build_object('error','NOT_FOUND');
  end if;
  select c.id,c.name into v_class,v_name
  from public.haiz_screen_secrets s
  join public.haiz_classes c on c.id=s.class_id
  where s.secret_hash=md5(p_key);
  if v_class is null then return jsonb_build_object('error','NOT_FOUND'); end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'subject',a.subject,'title',a.title,'due',a.due
  ) order by a.created_at desc),'[]'::jsonb)
  into v_assignments from (
    select subject,title,due,created_at from public.haiz_assignments
    where class_id=v_class and status='published'
    order by created_at desc,id desc limit 5
  ) a;
  return jsonb_build_object(
    'className',v_name,'assignments',v_assignments,
    'readOnly',true,'containsStudentIdentity',false
  );
end;
$$;

-- New functions default to PUBLIC execute unless explicitly revoked.
revoke all on function public.haiz_is_teacher(uuid) from public,anon;
revoke all on function public.haiz_is_member(uuid,boolean) from public,anon;
revoke all on function public.haiz_ensure_student() from public,anon;
revoke all on function public.haiz_request_join(text) from public,anon;
revoke all on function public.haiz_rotate_screen_key(uuid) from public,anon;
revoke all on function public.haiz_screen_feed(text) from public;
grant execute on function public.haiz_is_teacher(uuid) to authenticated;
grant execute on function public.haiz_is_member(uuid,boolean) to authenticated;
grant execute on function public.haiz_ensure_student() to authenticated;
grant execute on function public.haiz_request_join(text) to authenticated;
grant execute on function public.haiz_rotate_screen_key(uuid) to authenticated;
grant execute on function public.haiz_screen_feed(text) to anon,authenticated;

-- No policy/grant exposes haiz_screen_secrets directly to browser clients.
-- Assign teacher status only from a trusted SQL editor, e.g.
-- update public.haiz_user_roles set role='teacher'
-- where user_id=(select id from auth.users where email='verified-teacher@example.com');
