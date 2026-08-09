-- 为当前登录用户确保当天每日任务存在（新用户注册后当天即可看到任务）
CREATE OR REPLACE FUNCTION public.ensure_daily_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_tasks text[] := ARRAY['book_flight','book_mars','complete_flight','sign_in','recharge','view_dest'];
  v_codes text[];
  v_task text;
  v_desc text;
  v_target int;
  v_reward_xp int;
  v_reward_balance int;
  v_i int;
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.daily_tasks WHERE user_id = v_uid AND task_date = CURRENT_DATE) THEN
    RETURN;
  END IF;
  v_codes := ARRAY[]::text[];
  FOR v_i IN 1..3 LOOP
    LOOP
      v_task := v_tasks[1 + floor(random() * array_length(v_tasks,1))::int];
      EXIT WHEN NOT (v_task = ANY(v_codes));
    END LOOP;
    v_codes := array_append(v_codes, v_task);
    CASE v_task
      WHEN 'book_mars' THEN v_desc := '预订飞往火星的航班'; v_target := 1; v_reward_xp := 80; v_reward_balance := 800;
      WHEN 'complete_flight' THEN v_desc := '完成一次星际航行'; v_target := 1; v_reward_xp := 150; v_reward_balance := 1500;
      WHEN 'sign_in' THEN v_desc := '完成每日签到'; v_target := 1; v_reward_xp := 50; v_reward_balance := 200;
      WHEN 'recharge' THEN v_desc := '充值信用点'; v_target := 1; v_reward_xp := 60; v_reward_balance := 600;
      WHEN 'view_dest' THEN v_desc := '浏览3个目的地详情'; v_target := 3; v_reward_xp := 40; v_reward_balance := 400;
      ELSE v_desc := '预订任意航班'; v_target := 1; v_reward_xp := 50; v_reward_balance := 500;
    END CASE;
    INSERT INTO public.daily_tasks (user_id, task_date, task_code, task_desc, target_value, reward_xp, reward_balance)
    VALUES (v_uid, CURRENT_DATE, v_task, v_desc, v_target, v_reward_xp, v_reward_balance)
    ON CONFLICT (user_id, task_date, task_code) DO NOTHING;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_daily_tasks() TO authenticated;