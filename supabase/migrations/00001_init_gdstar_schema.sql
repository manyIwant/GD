-- ========== 扩展 ==========
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ========== 类型 ==========
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

-- ========== profiles 表 ==========
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  phone text,
  role public.user_role NOT NULL DEFAULT 'user',
  username text UNIQUE,
  avatar_url text,
  balance bigint NOT NULL DEFAULT 10000,
  xp int NOT NULL DEFAULT 0,
  level int NOT NULL DEFAULT 1,
  light_years_traveled numeric(20,4) NOT NULL DEFAULT 0,
  orders_completed int NOT NULL DEFAULT 0,
  achievements_count int NOT NULL DEFAULT 0,
  selected_ship text NOT NULL DEFAULT 'cnsa',
  last_sign_in_date date,
  sign_in_streak int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== orders 表 ==========
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_number text UNIQUE NOT NULL DEFAULT ('GD' || to_char(now(),'YYYYMMDDHH24MISS') || lpad((floor(random()*1000000))::text,6,'0')),
  origin text NOT NULL,
  destination text NOT NULL,
  plan_code text NOT NULL,
  plan_name text NOT NULL,
  icon text,
  cabin text NOT NULL,
  price bigint NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  departure_time timestamptz NOT NULL,
  arrival_time timestamptz NOT NULL,
  waypoints jsonb NOT NULL DEFAULT '[]',
  rad text,
  ticket_number text,
  purchases jsonb DEFAULT '[]',
  ship_code text NOT NULL DEFAULT 'cnsa',
  light_years numeric(20,4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== achievements 表 ==========
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_code text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_code)
);

-- ========== daily_tasks 表 ==========
CREATE TABLE public.daily_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_date date NOT NULL,
  task_code text NOT NULL,
  task_desc text NOT NULL,
  target_value int NOT NULL DEFAULT 1,
  current_value int NOT NULL DEFAULT 0,
  reward_xp int NOT NULL DEFAULT 50,
  reward_balance int NOT NULL DEFAULT 500,
  status text NOT NULL DEFAULT 'in_progress',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, task_date, task_code)
);

-- ========== flight_logs 表（星际明信片）==========
CREATE TABLE public.flight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  destination text NOT NULL,
  ship_name text NOT NULL,
  light_years numeric(20,4) NOT NULL DEFAULT 0,
  arrived_at timestamptz NOT NULL DEFAULT now(),
  postcard_data jsonb DEFAULT '{}'
);

-- ========== unlocked_ships 表 ==========
CREATE TABLE public.unlocked_ships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ship_code text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, ship_code)
);

-- ========== login skill: handle_new_user ==========
CREATE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, role, username)
  VALUES (NEW.id, NEW.email, NEW.phone, 'user'::public.user_role, split_part(NEW.email, '@', 1));
  -- 新用户默认解锁起始飞船
  INSERT INTO public.unlocked_ships (user_id, ship_code) VALUES (NEW.id, 'cnsa') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== get_user_role ==========
CREATE OR REPLACE FUNCTION public.get_user_role(uid uuid)
RETURNS public.user_role LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = uid;
$$;

-- ========== public_profiles 视图（排行榜用）==========
CREATE VIEW public.public_profiles AS
  SELECT id, username, avatar_url, level, xp, light_years_traveled, orders_completed, achievements_count, selected_ship, created_at
  FROM public.profiles;

-- ========== RLS 启用 ==========
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unlocked_ships ENABLE ROW LEVEL SECURITY;

-- ========== profiles 策略 ==========
CREATE POLICY "Admins full access profiles" ON public.profiles
  FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin'::public.user_role);
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM public.get_user_role(auth.uid()));

-- ========== orders 策略 ==========
CREATE POLICY "Users view own orders" ON public.orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own orders" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own orders" ON public.orders
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own orders" ON public.orders
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins full access orders" ON public.orders
  FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin'::public.user_role);

-- ========== achievements 策略 ==========
CREATE POLICY "Users view own achievements" ON public.achievements
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own achievements" ON public.achievements
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins full access achievements" ON public.achievements
  FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin'::public.user_role);

-- ========== daily_tasks 策略 ==========
CREATE POLICY "Users view own tasks" ON public.daily_tasks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own tasks" ON public.daily_tasks
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins full access tasks" ON public.daily_tasks
  FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin'::public.user_role);

-- ========== flight_logs 策略 ==========
CREATE POLICY "Users view own flight logs" ON public.flight_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own flight logs" ON public.flight_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins full access flight logs" ON public.flight_logs
  FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin'::public.user_role);

-- ========== unlocked_ships 策略 ==========
CREATE POLICY "Users view own ships" ON public.unlocked_ships
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own ships" ON public.unlocked_ships
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins full access ships" ON public.unlocked_ships
  FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin'::public.user_role);

-- ========== 业务函数：完成订单 ==========
CREATE OR REPLACE FUNCTION public.complete_order(p_order_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_order RECORD;
  v_xp_gain int;
  v_new_level int;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION '订单不存在'; END IF;
  IF v_order.status <> 'flying' THEN RAISE EXCEPTION '订单状态不允许完成'; END IF;
  IF v_order.user_id <> auth.uid() THEN RAISE EXCEPTION '无权操作'; END IF;

  v_xp_gain := 100 + LEAST((v_order.light_years * 10)::int, 500);

  UPDATE public.orders SET status = 'done' WHERE id = p_order_id;

  UPDATE public.profiles
  SET xp = xp + v_xp_gain,
      light_years_traveled = light_years_traveled + v_order.light_years,
      orders_completed = orders_completed + 1,
      level = GREATEST(1, FLOOR((xp + v_xp_gain) / 1000)::int + 1)
  WHERE id = v_order.user_id
  RETURNING level INTO v_new_level;

  INSERT INTO public.flight_logs (user_id, order_id, destination, ship_name, light_years, postcard_data)
  VALUES (v_order.user_id, p_order_id, v_order.destination, v_order.plan_name, v_order.light_years,
    jsonb_build_object('origin', v_order.origin, 'destination', v_order.destination, 'cabin', v_order.cabin, 'price', v_order.price, 'plan_code', v_order.plan_code));

  UPDATE public.daily_tasks
  SET current_value = current_value + 1,
      status = CASE WHEN current_value + 1 >= target_value THEN 'completed' ELSE status END
  WHERE user_id = v_order.user_id AND task_date = CURRENT_DATE
    AND task_code IN ('complete_flight','any_flight') AND status = 'in_progress';

  RETURN jsonb_build_object('xp_gain', v_xp_gain, 'light_years', v_order.light_years, 'new_level', v_new_level);
END;
$$;

-- ========== 业务函数：领取任务奖励 ==========
CREATE OR REPLACE FUNCTION public.claim_daily_task(p_task_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_task RECORD;
  v_new_level int;
BEGIN
  SELECT * INTO v_task FROM public.daily_tasks WHERE id = p_task_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION '任务不存在'; END IF;
  IF v_task.user_id <> auth.uid() THEN RAISE EXCEPTION '无权操作'; END IF;
  IF v_task.status <> 'completed' THEN RAISE EXCEPTION '任务未完成'; END IF;

  UPDATE public.daily_tasks SET status = 'claimed' WHERE id = p_task_id;

  UPDATE public.profiles
  SET xp = xp + v_task.reward_xp, balance = balance + v_task.reward_balance,
      level = GREATEST(1, FLOOR((xp + v_task.reward_xp) / 1000)::int + 1)
  WHERE id = v_task.user_id
  RETURNING level INTO v_new_level;

  RETURN jsonb_build_object('xp', v_task.reward_xp, 'balance', v_task.reward_balance, 'new_level', v_new_level);
END;
$$;

-- ========== 业务函数：每日签到 ==========
CREATE OR REPLACE FUNCTION public.daily_sign_in()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_profile RECORD;
  v_streak int;
  v_reward int;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION '用户不存在'; END IF;
  IF v_profile.last_sign_in_date = CURRENT_DATE THEN RAISE EXCEPTION '今日已签到'; END IF;

  IF v_profile.last_sign_in_date = CURRENT_DATE - 1 THEN
    v_streak := v_profile.sign_in_streak + 1;
  ELSE
    v_streak := 1;
  END IF;
  v_reward := 200 + (CASE WHEN v_streak % 7 = 0 THEN 800 ELSE 0 END);

  UPDATE public.profiles
  SET last_sign_in_date = CURRENT_DATE, sign_in_streak = v_streak, balance = balance + v_reward
  WHERE id = auth.uid();

  UPDATE public.daily_tasks
  SET current_value = current_value + 1,
      status = CASE WHEN current_value + 1 >= target_value THEN 'completed' ELSE status END
  WHERE user_id = auth.uid() AND task_date = CURRENT_DATE AND task_code = 'sign_in' AND status = 'in_progress';

  RETURN jsonb_build_object('reward', v_reward, 'streak', v_streak);
END;
$$;

-- ========== 业务函数：解锁成就 ==========
CREATE OR REPLACE FUNCTION public.unlock_achievement(p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_exists int;
BEGIN
  SELECT count(*) INTO v_exists FROM public.achievements WHERE user_id = auth.uid() AND achievement_code = p_code;
  IF v_exists > 0 THEN RETURN jsonb_build_object('new', false); END IF;

  INSERT INTO public.achievements (user_id, achievement_code) VALUES (auth.uid(), p_code);
  UPDATE public.profiles SET achievements_count = achievements_count + 1 WHERE id = auth.uid();

  RETURN jsonb_build_object('new', true);
END;
$$;

-- ========== 业务函数：解锁飞船 ==========
CREATE OR REPLACE FUNCTION public.unlock_ship(p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.unlocked_ships (user_id, ship_code) VALUES (auth.uid(), p_code) ON CONFLICT DO NOTHING;
  RETURN jsonb_build_object('unlocked', true, 'code', p_code);
END;
$$;

-- ========== 业务函数：更新任务进度 ==========
CREATE OR REPLACE FUNCTION public.inc_task_progress(p_task_code text, p_increment int DEFAULT 1)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.daily_tasks
  SET current_value = LEAST(current_value + p_increment, target_value),
      status = CASE WHEN current_value + p_increment >= target_value THEN 'completed' ELSE status END
  WHERE user_id = auth.uid() AND task_date = CURRENT_DATE AND task_code = p_task_code AND status = 'in_progress';
END;
$$;

-- ========== 排行榜 RPC ==========
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_category text, p_limit int DEFAULT 50)
RETURNS TABLE(id uuid, username text, avatar_url text, level int, xp int, light_years_traveled numeric, orders_completed int, achievements_count int, rank int)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT id, username, avatar_url, level, xp, light_years_traveled, orders_completed, achievements_count,
    ROW_NUMBER() OVER (ORDER BY
      CASE WHEN p_category = 'light_years' THEN light_years_traveled
           WHEN p_category = 'orders' THEN orders_completed::numeric
           WHEN p_category = 'achievements' THEN achievements_count::numeric
           ELSE xp END DESC NULLS LAST
    )::int
  FROM public.profiles
  ORDER BY
    CASE WHEN p_category = 'light_years' THEN light_years_traveled
         WHEN p_category = 'orders' THEN orders_completed::numeric
         WHEN p_category = 'achievements' THEN achievements_count::numeric
         ELSE xp END DESC NULLS LAST
  LIMIT p_limit;
$$;

-- ========== 每日任务生成（cron 调用）==========
CREATE OR REPLACE FUNCTION public.generate_daily_tasks_for_all()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user RECORD;
  v_tasks text[];
  v_codes text[];
  v_task text;
  v_desc text;
  v_target int;
  v_reward_xp int;
  v_reward_balance int;
  v_i int;
BEGIN
  v_tasks := ARRAY['book_flight','book_mars','complete_flight','sign_in','recharge','view_dest'];

  FOR v_user IN SELECT id FROM public.profiles LOOP
    IF NOT EXISTS (SELECT 1 FROM public.daily_tasks WHERE user_id = v_user.id AND task_date = CURRENT_DATE) THEN
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
        VALUES (v_user.id, CURRENT_DATE, v_task, v_desc, v_target, v_reward_xp, v_reward_balance)
        ON CONFLICT (user_id, task_date, task_code) DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;
END;
$$;

-- ========== pg_cron 调度：每日0点（UTC 16:00 = 北京时间 00:00）==========
SELECT cron.schedule('gdstar-generate-daily-tasks', '0 16 * * *', 'SELECT public.generate_daily_tasks_for_all();');
