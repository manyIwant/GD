DROP VIEW public_profiles;

-- 提高光年数值精度（10 位小数），保留太阳系内微小距离
ALTER TABLE orders ALTER COLUMN light_years TYPE numeric(24,10);
ALTER TABLE profiles ALTER COLUMN light_years_traveled TYPE numeric(24,10);
ALTER TABLE flight_logs ALTER COLUMN light_years TYPE numeric(24,10);

-- 重新回填历史订单真实光年
UPDATE orders SET light_years = CASE
  WHEN destination LIKE '%月球%' THEN 0.000000041
  WHEN destination LIKE '%谷神星%' THEN 0.0000437
  WHEN destination LIKE '%火星%' THEN 0.0000244
  WHEN destination LIKE '%木星%' THEN 0.000069
  WHEN destination LIKE '%太阳系%' OR destination LIKE '%跃迁%' THEN 0.0016
  WHEN destination LIKE '%比邻星%' OR destination LIKE '%三体%' THEN 4.24
  WHEN destination LIKE '%半人马%' THEN 4.37
  WHEN destination LIKE '%巴纳德%' THEN 5.96
  WHEN destination LIKE '%天狼星%' THEN 8.6
  WHEN destination LIKE '%罗斯128%' THEN 11.0
  WHEN destination LIKE '%格利泽%' THEN 20.4
  WHEN destination LIKE '%大麦哲伦%' THEN 163000
  WHEN destination LIKE '%仙女%' THEN 2537000
  ELSE 0
END;

-- 同步 flight_logs 与 profiles
UPDATE flight_logs fl SET light_years = (SELECT o.light_years FROM orders o WHERE o.id = fl.order_id);
UPDATE profiles p SET light_years_traveled = COALESCE((
  SELECT COALESCE(SUM(o.light_years), 0) FROM orders o WHERE o.user_id = p.id AND o.status = 'done'
), 0);

-- 重建视图
CREATE VIEW public_profiles AS
SELECT id, username, avatar_url, level, xp, light_years_traveled, orders_completed, achievements_count, selected_ship, created_at
FROM profiles;