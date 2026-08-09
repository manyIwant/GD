-- ===== 飞船公司经验与属性升级系统（参考钢铁雄心4军工产业升级） =====
CREATE TABLE public.ship_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ship_code text NOT NULL,
  exp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  upgrade_points integer NOT NULL DEFAULT 0,
  upgrades jsonb NOT NULL DEFAULT '{}'::jsonb,
  trips integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, ship_code)
);

ALTER TABLE public.ship_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ship_progress_select_own" ON public.ship_progress
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "ship_progress_insert_own" ON public.ship_progress
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "ship_progress_update_own" ON public.ship_progress
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 升级阈值：每级所需经验（累计）
-- Lv1->2: 100, Lv2->3: 300, Lv3->4: 600, Lv4->5: 1000, Lv5->6: 1500 ...
CREATE OR REPLACE FUNCTION public.ship_level_threshold(level int)
RETURNS integer LANGUAGE sql IMMUTABLE AS $$
  SELECT 100 * level * (level + 1) / 2;
$$;

-- 完成航行时累积飞船经验（按本次航行光年计算）
CREATE OR REPLACE FUNCTION public.add_ship_exp(p_ship_code text, p_light_years numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row RECORD;
  v_exp_gain int;
  v_old_level int;
  v_new_level int;
  v_leveled_up boolean := false;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION '未登录'; END IF;
  v_exp_gain := GREATEST(20, (p_light_years * 5)::int);

  INSERT INTO public.ship_progress (user_id, ship_code, exp, trips)
  VALUES (v_uid, p_ship_code, v_exp_gain, 1)
  ON CONFLICT (user_id, ship_code) DO UPDATE
    SET exp = ship_progress.exp + v_exp_gain,
        trips = ship_progress.trips + 1,
        updated_at = now()
  RETURNING * INTO v_row;

  v_old_level := v_row.level;
  -- 循环升级
  WHILE v_row.exp >= ship_level_threshold(v_row.level) AND v_row.level < 10 LOOP
    v_row.level := v_row.level + 1;
    v_row.upgrade_points := v_row.upgrade_points + 1;
  END LOOP;

  v_new_level := v_row.level;
  v_leveled_up := v_new_level > v_old_level;

  UPDATE public.ship_progress
  SET level = v_row.level, upgrade_points = v_row.upgrade_points
  WHERE id = v_row.id;

  RETURN jsonb_build_object('exp_gain', v_exp_gain, 'level', v_new_level, 'leveled_up', v_leveled_up, 'upgrade_points', v_row.upgrade_points);
END;
$$;

-- 消耗升级点数解锁属性节点
CREATE OR REPLACE FUNCTION public.spend_ship_upgrade(p_ship_code text, p_attr text, p_node int)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row RECORD;
  v_key text;
  v_current int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION '未登录'; END IF;
  IF p_attr NOT IN ('firepower','defense','speed','endurance') THEN RAISE EXCEPTION '无效属性'; END IF;
  IF p_node < 1 OR p_node > 5 THEN RAISE EXCEPTION '无效节点'; END IF;

  SELECT * INTO v_row FROM public.ship_progress WHERE user_id = v_uid AND ship_code = p_ship_code FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION '飞船未启用'; END IF;
  IF v_row.upgrade_points < 1 THEN RAISE EXCEPTION '升级点数不足'; END IF;

  v_key := p_attr;
  v_current := COALESCE((v_row.upgrades->>v_key)::int, 0);
  IF v_current >= p_node THEN RAISE EXCEPTION '该节点已解锁'; END IF;
  IF p_node > v_current + 1 THEN RAISE EXCEPTION '需先解锁前置节点'; END IF;

  v_row.upgrades := jsonb_set(v_row.upgrades, ARRAY[v_key], to_jsonb(p_node));
  UPDATE public.ship_progress SET upgrades = v_row.upgrades, upgrade_points = upgrade_points - 1, updated_at = now() WHERE id = v_row.id;

  RETURN jsonb_build_object('attr', p_attr, 'node', p_node, 'upgrade_points', v_row.upgrade_points - 1);
END;
$$;

-- ===== 转盘抽奖：记录抽奖结果 =====
CREATE TABLE public.spin_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_type text NOT NULL,
  reward_value integer NOT NULL DEFAULT 0,
  reward_label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.spin_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "spin_select_own" ON public.spin_records
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "spin_insert_own" ON public.spin_records
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 转盘抽奖 RPC：消耗信用点，随机奖励并发放
CREATE OR REPLACE FUNCTION public.spin_wheel(p_cost integer DEFAULT 500)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_profile RECORD;
  v_roll numeric;
  v_type text;
  v_value int;
  v_label text;
  v_icon text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION '未登录'; END IF;
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION '用户不存在'; END IF;
  IF v_profile.balance < p_cost THEN RAISE EXCEPTION '信用点不足'; END IF;

  UPDATE public.profiles SET balance = balance - p_cost WHERE id = v_uid;

  v_roll := random();
  IF v_roll < 0.35 THEN v_type := 'balance'; v_value := 300; v_label := '信用点 +300'; v_icon := '💰';
  ELSIF v_roll < 0.55 THEN v_type := 'balance'; v_value := 1000; v_label := '信用点 +1000'; v_icon := '💎';
  ELSIF v_roll < 0.72 THEN v_type := 'xp'; v_value := 200; v_label := '经验值 +200'; v_icon := '⭐';
  ELSIF v_roll < 0.85 THEN v_type := 'balance'; v_value := 200; v_label := '信用点 +200'; v_icon := '🪙';
  ELSIF v_roll < 0.95 THEN v_type := 'balance'; v_value := 5000; v_label := '大奖！信用点 +5000'; v_icon := '🏆';
  ELSE v_type := 'balance'; v_value := 50; v_label := '谢谢参与 +50'; v_icon := '🎁';
  END IF;

  IF v_type = 'balance' THEN
    UPDATE public.profiles SET balance = balance + v_value WHERE id = v_uid;
  ELSIF v_type = 'xp' THEN
    UPDATE public.profiles SET xp = xp + v_value WHERE id = v_uid;
  END IF;

  INSERT INTO public.spin_records (user_id, reward_type, reward_value, reward_label)
  VALUES (v_uid, v_type, v_value, v_label);

  RETURN jsonb_build_object('type', v_type, 'value', v_value, 'label', v_label, 'icon', v_icon);
END;
$$;