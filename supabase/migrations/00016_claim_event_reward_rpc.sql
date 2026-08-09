CREATE OR REPLACE FUNCTION public.claim_event_reward(p_balance integer, p_xp integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_new_level int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION '未登录'; END IF;
  UPDATE public.profiles
  SET balance = balance + p_balance,
      xp = xp + p_xp,
      level = GREATEST(1, FLOOR((xp + p_xp) / 1000)::int + 1)
  WHERE id = v_uid
  RETURNING level INTO v_new_level;
  RETURN jsonb_build_object('balance_added', p_balance, 'xp_added', p_xp, 'new_level', v_new_level);
END;
$$;