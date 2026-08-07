DROP FUNCTION IF EXISTS public.get_all_profiles();

CREATE OR REPLACE FUNCTION public.get_all_profiles()
RETURNS TABLE (
  id uuid, username text, role text, balance int, xp int, level int,
  light_years numeric, sign_in_streak int, banned boolean, created_at timestamptz
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
    p.light_years, p.sign_in_streak, p.banned, p.created_at
  FROM public.profiles p ORDER BY p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_profiles() TO authenticated;