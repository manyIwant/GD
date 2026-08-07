ALTER TABLE public.profiles ADD COLUMN mementos jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN explore_achievements jsonb DEFAULT '[]'::jsonb;

-- 添加一件纪念品（仅本人）
CREATE OR REPLACE FUNCTION public.add_memento(p_name text, p_desc text, p_emoji text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION '未登录'; END IF;
  UPDATE public.profiles
  SET mementos = mementos || jsonb_build_object('name', p_name, 'desc', p_desc, 'emoji', p_emoji)
  WHERE id = v_uid;
END;
$$;

-- 解锁一个探索成就（仅本人）
CREATE OR REPLACE FUNCTION public.unlock_explore_achievement(p_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION '未登录'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = v_uid AND explore_achievements @> jsonb_build_array(p_name)
  ) THEN
    UPDATE public.profiles SET explore_achievements = explore_achievements || jsonb_build_array(p_name) WHERE id = v_uid;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_memento(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_explore_achievement(text) TO authenticated;