CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, phone, role, username)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    'user'::public.user_role,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'username', ''), split_part(NEW.email, '@', 1))
  );
  -- 新用户默认解锁起始飞船
  INSERT INTO public.unlocked_ships (user_id, ship_code) VALUES (NEW.id, 'cnsa') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;