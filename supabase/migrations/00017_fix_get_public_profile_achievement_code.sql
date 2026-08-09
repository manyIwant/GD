CREATE OR REPLACE FUNCTION public.get_public_profile(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_row public.profiles%ROWTYPE; v_active jsonb; v_ach jsonb; v_online boolean;
BEGIN
  SELECT * INTO v_row FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('found', false); END IF;
  v_online := (v_row.last_seen_at IS NOT NULL AND v_row.last_seen_at > now() - interval '5 minutes');
  IF v_row.is_private THEN
    RETURN jsonb_build_object('found', true, 'is_private', true, 'username', v_row.username,
      'level', v_row.level, 'created_at', v_row.created_at, 'online', v_online);
  END IF;
  SELECT jsonb_agg(row_to_json(o)) INTO v_active FROM (
    SELECT id, plan_name, origin, destination, status, price, light_years, created_at
    FROM public.orders WHERE user_id = p_user_id AND status IN ('pending','flying') ORDER BY created_at DESC LIMIT 5
  ) o;
  SELECT jsonb_agg(row_to_json(a)) INTO v_ach FROM (
    SELECT achievement_code AS code, unlocked_at FROM public.achievements WHERE user_id = p_user_id ORDER BY unlocked_at DESC LIMIT 8
  ) a;
  RETURN jsonb_build_object('found', true, 'is_private', false, 'id', v_row.id, 'username', v_row.username,
    'avatar_url', v_row.avatar_url, 'level', v_row.level, 'xp', v_row.xp,
    'light_years_traveled', v_row.light_years_traveled, 'orders_completed', v_row.orders_completed,
    'achievements_count', v_row.achievements_count, 'selected_ship', v_row.selected_ship,
    'sign_in_streak', v_row.sign_in_streak, 'created_at', v_row.created_at,
    'online', v_online, 'interest', v_row.interest,
    'active_orders', COALESCE(v_active, '[]'::jsonb), 'achievements', COALESCE(v_ach, '[]'::jsonb));
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_admin_user_detail(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_row public.profiles%ROWTYPE; v_active jsonb; v_ach jsonb; v_online boolean;
BEGIN
  SELECT * INTO v_row FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('found', false); END IF;
  v_online := (v_row.last_seen_at IS NOT NULL AND v_row.last_seen_at > now() - interval '5 minutes');
  SELECT jsonb_agg(row_to_json(o)) INTO v_active FROM (
    SELECT id, plan_name, origin, destination, status, price, light_years, created_at
    FROM public.orders WHERE user_id = p_user_id AND status IN ('pending','flying') ORDER BY created_at DESC LIMIT 5
  ) o;
  SELECT jsonb_agg(row_to_json(a)) INTO v_ach FROM (
    SELECT achievement_code AS code, unlocked_at FROM public.achievements WHERE user_id = p_user_id ORDER BY unlocked_at DESC LIMIT 8
  ) a;
  RETURN jsonb_build_object('found', true,
    'id', v_row.id, 'username', v_row.username, 'role', v_row.role, 'level', v_row.level, 'xp', v_row.xp,
    'balance', v_row.balance, 'light_years_traveled', v_row.light_years_traveled, 'orders_completed', v_row.orders_completed,
    'achievements_count', v_row.achievements_count, 'selected_ship', v_row.selected_ship, 'sign_in_streak', v_row.sign_in_streak,
    'created_at', v_row.created_at, 'interest', v_row.interest, 'banned', v_row.banned, 'ban_reason', v_row.ban_reason,
    'appeal_chances', v_row.appeal_chances, 'appeal_count', v_row.appeal_count, 'is_private', v_row.is_private,
    'online', v_online,
    'active_orders', COALESCE(v_active, '[]'::jsonb), 'achievements', COALESCE(v_ach, '[]'::jsonb));
END;
$function$;