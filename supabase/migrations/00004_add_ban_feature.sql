-- 封禁功能：profiles 增加 banned 字段
ALTER TABLE public.profiles ADD COLUMN banned boolean NOT NULL DEFAULT false;

-- 管理员封禁用户
CREATE OR REPLACE FUNCTION public.ban_user(p_user_id uuid)
RETURNS void
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
  IF p_user_id = v_uid THEN
    RAISE EXCEPTION '不能封禁自己';
  END IF;
  UPDATE public.profiles SET banned = true WHERE id = p_user_id;
END;
$$;

-- 管理员解封用户
CREATE OR REPLACE FUNCTION public.unban_user(p_user_id uuid)
RETURNS void
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
  UPDATE public.profiles SET banned = false WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ban_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unban_user(uuid) TO authenticated;