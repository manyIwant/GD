DROP FUNCTION IF EXISTS public.get_all_orders();

CREATE FUNCTION public.get_all_orders()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  username text,
  plan_name text,
  origin text,
  destination text,
  status text,
  price integer,
  light_years numeric,
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
  SELECT role INTO v_role FROM public.profiles WHERE id = v_uid;
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

GRANT EXECUTE ON FUNCTION public.get_all_orders() TO authenticated;