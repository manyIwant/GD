ALTER TABLE public.profiles ADD COLUMN ship_config jsonb DEFAULT '{}'::jsonb;

-- 保存个人飞船配置（仅本人）
CREATE OR REPLACE FUNCTION public.save_ship_config(p_config jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION '未登录';
  END IF;
  UPDATE public.profiles SET ship_config = p_config WHERE id = v_uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_ship_config(jsonb) TO authenticated;