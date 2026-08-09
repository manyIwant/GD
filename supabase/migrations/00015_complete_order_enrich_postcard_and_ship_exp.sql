CREATE OR REPLACE FUNCTION public.complete_order(p_order_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_order RECORD;
  v_xp_gain int;
  v_new_level int;
  v_flight_no text;
  v_duration_days int;
  v_ach_codes text[] := ARRAY[]::text[];
  v_ach_names text[] := ARRAY[]::text[];
  v_ach_icons text[] := ARRAY[]::text[];
  v_ship_exp jsonb;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION '订单不存在'; END IF;
  IF v_order.status <> 'flying' THEN RAISE EXCEPTION '订单状态不允许完成'; END IF;
  IF v_order.user_id <> auth.uid() THEN RAISE EXCEPTION '无权操作'; END IF;

  v_xp_gain := 100 + LEAST((v_order.light_years * 10)::int, 500);
  v_duration_days := GREATEST(1, EXTRACT(day FROM (v_order.arrival_time - v_order.departure_time))::int);

  -- 本次航行解锁的成就（基于目的地）
  IF v_order.destination LIKE '%月球%' THEN v_ach_codes := v_ach_codes || 'moonTrip'; END IF;
  IF v_order.destination LIKE '%火星%' THEN v_ach_codes := v_ach_codes || 'marsTrip'; END IF;
  IF v_order.destination LIKE '%翁法罗斯%' THEN v_ach_codes := v_ach_codes || 'omphalos'; END IF;
  IF v_order.destination LIKE '%比邻星%' OR v_order.destination LIKE '%三体%' THEN v_ach_codes := v_ach_codes || 'trisolaris'; END IF;
  IF v_order.destination LIKE '%B612%' OR v_order.destination LIKE '%小王子%' THEN v_ach_codes := v_ach_codes || 'b612'; END IF;
  IF v_order.destination LIKE '%仙女%' THEN v_ach_codes := v_ach_codes || 'andromeda'; END IF;

  SELECT array_agg(name), array_agg(icon) INTO v_ach_names, v_ach_icons
  FROM (VALUES
    ('moonTrip','月球漫步','🌙'),('marsTrip','红色星球','🔴'),('omphalos','永恒之地的访客','🏛'),
    ('trisolaris','不要回答','🔴'),('b612','玫瑰与狐狸','🌹'),('andromeda','河外边疆','🌀')
  ) AS t(code, name, icon)
  WHERE t.code = ANY(v_ach_codes);

  v_flight_no := 'SJ-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || lpad((floor(random()*90000)+10000)::text, 5, '0');

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
    jsonb_build_object(
      'origin', v_order.origin,
      'destination', v_order.destination,
      'cabin', v_order.cabin,
      'price', v_order.price,
      'plan_code', v_order.plan_code,
      'flight_no', v_flight_no,
      'duration_days', v_duration_days,
      'achievements', COALESCE(v_ach_names, ARRAY[]::text[]),
      'achievement_icons', COALESCE(v_ach_icons, ARRAY[]::text[])
    ));

  -- 累积飞船公司经验
  v_ship_exp := public.add_ship_exp(v_order.ship_code, v_order.light_years);

  UPDATE public.daily_tasks
  SET current_value = current_value + 1,
      status = CASE WHEN current_value + 1 >= target_value THEN 'completed' ELSE status END
  WHERE user_id = v_order.user_id AND task_date = CURRENT_DATE
    AND task_code IN ('complete_flight','any_flight') AND status = 'in_progress';

  RETURN jsonb_build_object('xp_gain', v_xp_gain, 'light_years', v_order.light_years, 'new_level', v_new_level, 'ship_exp', v_ship_exp);
END;
$$;