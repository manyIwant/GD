-- 修复：RETURNS TABLE 中含 role 列导致 "role is ambiguous"
-- 需先 DROP 再 CREATE（get_all_orders 返回类型与上次相同，可直接 OR REPLACE；但为统一处理，全部 DROP 重建）

DROP FUNCTION IF EXISTS public.get_admin_stats();
DROP FUNCTION IF EXISTS public.get_all_profiles();
DROP FUNCTION IF EXISTS public.get_all_orders();

CREATE FUNCTION public.get_admin_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text;
  v_user_count int;
  v_order_count int;
  v_total_ly numeric;
  v_total_xp int;
  v_flying_count int;
BEGIN
  SELECT public.profiles.role INTO v_role FROM public.profiles WHERE public.profiles.id = v_uid;
  IF v_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION '无管理员权限';
  END IF;
  SELECT count(*) INTO v_user_count FROM public.profiles;
  SELECT count(*) INTO v_order_count FROM public.orders;
  SELECT COALESCE(sum(light_years),0) INTO v_total_ly FROM public.orders WHERE status = 'done';
  SELECT COALESCE(sum(xp),0) INTO v_total_xp FROM public.profiles;
  SELECT count(*) INTO v_flying_count FROM public.orders WHERE status = 'flying';
  RETURN json_build_object(
    'user_count', v_user_count,
    'order_count', v_order_count,
    'total_ly', v_total_ly,
    'total_xp', v_total_xp,
    'flying_count', v_flying_count
  );
END;
$$;

CREATE FUNCTION public.get_all_profiles()
RETURNS TABLE(
  id uuid, username text, role text, balance integer, xp integer,
  level integer, light_years numeric, sign_in_streak integer,
  banned boolean, created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text;
BEGIN
  SELECT public.profiles.role INTO v_role FROM public.profiles WHERE public.profiles.id = v_uid;
  IF v_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION '无管理员权限';
  END IF;
  RETURN QUERY SELECT p.id, p.username, p.role::text, p.balance, p.xp, p.level,
    p.light_years, p.sign_in_streak, p.banned, p.created_at
  FROM public.profiles p ORDER BY p.created_at DESC;
END;
$$;

CREATE FUNCTION public.get_all_orders()
RETURNS TABLE(
  id uuid, user_id uuid, username text, plan_name text, origin text,
  destination text, status text, price integer, light_years numeric,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text;
BEGIN
  SELECT public.profiles.role INTO v_role FROM public.profiles WHERE public.profiles.id = v_uid;
  IF v_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION '无管理员权限';
  END IF;
  RETURN QUERY
    SELECT o.id, o.user_id, p.username, o.plan_name, o.origin, o.destination,
      o.status::text, o.price, o.light_years, o.created_at
    FROM public.orders o
    LEFT JOIN public.profiles p ON p.id = o.user_id
    ORDER BY o.created_at DESC LIMIT 200;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_orders() TO authenticated;