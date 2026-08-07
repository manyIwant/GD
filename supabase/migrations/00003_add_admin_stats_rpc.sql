-- 管理员统计：返回全站用户数、订单数、总光年、总XP等
CREATE OR REPLACE FUNCTION public.get_admin_stats()
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
  SELECT role INTO v_role FROM public.profiles WHERE id = v_uid;
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

-- 管理员：获取所有用户列表
CREATE OR REPLACE FUNCTION public.get_all_profiles()
RETURNS TABLE (
  id uuid, username text, role text, balance int, xp int, level int,
  light_years numeric, sign_in_streak int, created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = v_uid;
  IF v_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION '无管理员权限';
  END IF;
  RETURN QUERY SELECT p.id, p.username, p.role::text, p.balance, p.xp, p.level,
    p.light_years, p.sign_in_streak, p.created_at
  FROM public.profiles p ORDER BY p.created_at DESC;
END;
$$;

-- 管理员：获取所有订单
CREATE OR REPLACE FUNCTION public.get_all_orders()
RETURNS TABLE (
  id uuid, user_id uuid, plan_name text, origin text, destination text,
  status text, price int, light_years numeric, created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = v_uid;
  IF v_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION '无管理员权限';
  END IF;
  RETURN QUERY SELECT o.id, o.user_id, o.plan_name, o.origin, o.destination,
    o.status::text, o.price, o.light_years, o.created_at
  FROM public.orders o ORDER BY o.created_at DESC LIMIT 200;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_orders() TO authenticated;