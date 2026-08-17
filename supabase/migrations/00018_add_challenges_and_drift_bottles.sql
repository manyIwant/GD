-- ===== 挑战系统 =====
CREATE TABLE public.challenge_defs (
  code text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  goal_type text NOT NULL CHECK (goal_type IN ('flight','xp')),
  goal_target integer NOT NULL,
  reward_xp integer NOT NULL DEFAULT 0,
  reward_balance integer NOT NULL DEFAULT 0,
  penalty_xp integer NOT NULL DEFAULT 0,
  penalty_balance integer NOT NULL DEFAULT 0,
  duration_minutes integer NOT NULL DEFAULT 10,
  sort_order integer NOT NULL DEFAULT 0
);
ALTER TABLE public.challenge_defs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view challenge defs" ON public.challenge_defs
  FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.challenge_defs (code, title, description, goal_type, goal_target, reward_xp, reward_balance, penalty_xp, penalty_balance, duration_minutes, sort_order) VALUES
('speedrun', '极速起航', '在限时内完成 1 次航行，考验你的行动力', 'flight', 1, 300, 2000, 100, 500, 10, 1),
('double', '双星连击', '在限时内完成 2 次航行，证明你的星际实力', 'flight', 2, 600, 5000, 200, 1000, 15, 2),
('flight3', '三星远征', '在限时内完成 3 次航行，向银河深处进发', 'flight', 3, 800, 6000, 250, 1500, 25, 3),
('xp500', '经验冲刺', '在限时内获得 500 经验值，快速成长', 'xp', 500, 200, 3000, 100, 800, 20, 4),
('xp1000', '银河新星', '在限时内获得 1000 经验值，闪耀星海', 'xp', 1000, 500, 8000, 300, 2000, 30, 5);

CREATE TABLE public.user_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_code text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  goal_type text NOT NULL,
  goal_target integer NOT NULL,
  baseline integer NOT NULL DEFAULT 0,
  reward_xp integer NOT NULL DEFAULT 0,
  reward_balance integer NOT NULL DEFAULT 0,
  penalty_xp integer NOT NULL DEFAULT 0,
  penalty_balance integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','failed','claimed')),
  progress integer NOT NULL DEFAULT 0,
  settled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_user_challenges_user ON public.user_challenges(user_id, status);
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own challenges" ON public.user_challenges
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins full access challenges" ON public.user_challenges
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role)
  WITH CHECK (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE OR REPLACE FUNCTION public.accept_challenge(p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_def RECORD; v_uid uuid := auth.uid(); v_active RECORD; v_baseline integer; v_row RECORD;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION '请先登录'; END IF;
  SELECT * INTO v_def FROM public.challenge_defs WHERE code = p_code;
  IF NOT FOUND THEN RAISE EXCEPTION '挑战不存在'; END IF;
  SELECT * INTO v_active FROM public.user_challenges WHERE user_id = v_uid AND status = 'active';
  IF FOUND THEN RAISE EXCEPTION '已有进行中的挑战，请先完成或等待结算'; END IF;
  v_baseline := CASE WHEN v_def.goal_type = 'flight' THEN (SELECT orders_completed FROM public.profiles WHERE id = v_uid)
                     ELSE (SELECT xp FROM public.profiles WHERE id = v_uid) END;
  INSERT INTO public.user_challenges (user_id, challenge_code, title, description, goal_type, goal_target, baseline, reward_xp, reward_balance, penalty_xp, penalty_balance, expires_at)
  VALUES (v_uid, v_def.code, v_def.title, v_def.description, v_def.goal_type, v_def.goal_target, COALESCE(v_baseline,0), v_def.reward_xp, v_def.reward_balance, v_def.penalty_xp, v_def.penalty_balance, now() + (v_def.duration_minutes || ' minutes')::interval)
  RETURNING * INTO v_row;
  RETURN jsonb_build_object('id', v_row.id, 'challenge_code', v_row.challenge_code, 'title', v_row.title, 'description', v_row.description, 'goal_type', v_row.goal_type, 'goal_target', v_row.goal_target, 'baseline', v_row.baseline, 'reward_xp', v_row.reward_xp, 'reward_balance', v_row.reward_balance, 'penalty_xp', v_row.penalty_xp, 'penalty_balance', v_row.penalty_balance, 'expires_at', v_row.expires_at, 'progress', v_row.progress, 'status', v_row.status);
END;
$$;

CREATE OR REPLACE FUNCTION public.settle_challenge(p_challenge_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_row RECORD; v_current integer; v_progress integer; v_success boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION '请先登录'; END IF;
  SELECT * INTO v_row FROM public.user_challenges WHERE id = p_challenge_id AND user_id = v_uid;
  IF NOT FOUND THEN RAISE EXCEPTION '挑战不存在'; END IF;
  IF v_row.status <> 'active' THEN RETURN jsonb_build_object('already_settled', true, 'status', v_row.status); END IF;
  v_current := CASE WHEN v_row.goal_type = 'flight' THEN (SELECT orders_completed FROM public.profiles WHERE id = v_uid)
                    ELSE (SELECT xp FROM public.profiles WHERE id = v_uid) END;
  v_progress := GREATEST(0, COALESCE(v_current,0) - v_row.baseline);
  v_success := v_progress >= v_row.goal_target;
  IF v_success THEN
    UPDATE public.user_challenges SET status = 'completed', progress = v_progress, settled_at = now() WHERE id = p_challenge_id;
    UPDATE public.profiles SET xp = xp + v_row.reward_xp, balance = balance + v_row.reward_balance WHERE id = v_uid;
  ELSE
    UPDATE public.user_challenges SET status = 'failed', progress = v_progress, settled_at = now() WHERE id = p_challenge_id;
    UPDATE public.profiles SET xp = GREATEST(0, xp - v_row.penalty_xp), balance = GREATEST(0, balance - v_row.penalty_balance) WHERE id = v_uid;
  END IF;
  RETURN jsonb_build_object('success', v_success, 'status', CASE WHEN v_success THEN 'completed' ELSE 'failed' END, 'progress', v_progress, 'goal_target', v_row.goal_target, 'reward_xp', v_row.reward_xp, 'reward_balance', v_row.reward_balance, 'penalty_xp', v_row.penalty_xp, 'penalty_balance', v_row.penalty_balance);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_active_challenge()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_row RECORD;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('found', false); END IF;
  SELECT * INTO v_row FROM public.user_challenges WHERE user_id = v_uid AND status = 'active' ORDER BY created_at DESC LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('found', false); END IF;
  RETURN jsonb_build_object('found', true, 'id', v_row.id, 'challenge_code', v_row.challenge_code, 'title', v_row.title, 'description', v_row.description, 'goal_type', v_row.goal_type, 'goal_target', v_row.goal_target, 'baseline', v_row.baseline, 'reward_xp', v_row.reward_xp, 'reward_balance', v_row.reward_balance, 'penalty_xp', v_row.penalty_xp, 'penalty_balance', v_row.penalty_balance, 'expires_at', v_row.expires_at, 'progress', v_row.progress, 'status', v_row.status);
END;
$$;

-- ===== 漂流瓶系统 =====
CREATE TABLE public.drift_bottles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.drift_bottles(id) ON DELETE CASCADE,
  content text NOT NULL,
  likes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_drift_bottles_parent ON public.drift_bottles(parent_id);
CREATE INDEX idx_drift_bottles_sender ON public.drift_bottles(sender_id);
ALTER TABLE public.drift_bottles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view bottles" ON public.drift_bottles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own bottles" ON public.drift_bottles
  FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Users update own bottles" ON public.drift_bottles
  FOR UPDATE TO authenticated USING (sender_id = auth.uid()) WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Users delete own bottles" ON public.drift_bottles
  FOR DELETE TO authenticated USING (sender_id = auth.uid());
CREATE POLICY "Admins full access bottles" ON public.drift_bottles
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role)
  WITH CHECK (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE TABLE public.bottle_likes (
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  bottle_id uuid NOT NULL REFERENCES public.drift_bottles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, bottle_id)
);
ALTER TABLE public.bottle_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own likes" ON public.bottle_likes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own likes" ON public.bottle_likes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins full access likes" ON public.bottle_likes
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin'::user_role)
  WITH CHECK (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE OR REPLACE FUNCTION public.send_bottle(p_content text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_row RECORD;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION '请先登录'; END IF;
  IF length(trim(p_content)) < 1 OR length(p_content) > 500 THEN RAISE EXCEPTION '讯息长度需在1-500字之间'; END IF;
  INSERT INTO public.drift_bottles (sender_id, content) VALUES (v_uid, trim(p_content)) RETURNING id, content, created_at, likes INTO v_row;
  RETURN jsonb_build_object('id', v_row.id, 'content', v_row.content, 'created_at', v_row.created_at, 'likes', v_row.likes);
END;
$$;

CREATE OR REPLACE FUNCTION public.reply_bottle(p_parent_id uuid, p_content text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_row RECORD;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION '请先登录'; END IF;
  IF length(trim(p_content)) < 1 OR length(p_content) > 500 THEN RAISE EXCEPTION '回复长度需在1-500字之间'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.drift_bottles WHERE id = p_parent_id AND parent_id IS NULL) THEN RAISE EXCEPTION '漂流瓶不存在'; END IF;
  INSERT INTO public.drift_bottles (sender_id, parent_id, content) VALUES (v_uid, p_parent_id, trim(p_content)) RETURNING id, content, created_at INTO v_row;
  RETURN jsonb_build_object('id', v_row.id, 'content', v_row.content, 'created_at', v_row.created_at);
END;
$$;

CREATE OR REPLACE FUNCTION public.like_bottle(p_bottle_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_new_likes integer;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION '请先登录'; END IF;
  INSERT INTO public.bottle_likes (user_id, bottle_id) VALUES (v_uid, p_bottle_id) ON CONFLICT DO NOTHING;
  UPDATE public.drift_bottles SET likes = (SELECT count(*) FROM public.bottle_likes WHERE bottle_id = p_bottle_id) WHERE id = p_bottle_id;
  SELECT likes INTO v_new_likes FROM public.drift_bottles WHERE id = p_bottle_id;
  RETURN jsonb_build_object('likes', v_new_likes);
END;
$$;