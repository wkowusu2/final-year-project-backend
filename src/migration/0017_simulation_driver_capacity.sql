-- Expand the dedicated presentation identities from 10 to 110 so each of the
-- eleven supervised road corridors can have ten distinct virtual drivers.
INSERT INTO "users" ("id", "phone", "role")
SELECT
  ('10000000-0000-4000-8000-' || lpad(driver_number::text, 12, '0'))::uuid,
  '0209' || lpad(driver_number::text, 6, '0'),
  'driver'
FROM generate_series(11, 110) AS driver_number
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint

INSERT INTO "drivers" ("id", "full_name", "email", "phone", "deleted", "on_boarding_done")
SELECT
  ('10000000-0000-4000-8000-' || lpad(driver_number::text, 12, '0'))::uuid,
  'Simulation Driver ' || lpad(driver_number::text, 3, '0'),
  'simulation.driver' || lpad(driver_number::text, 3, '0') || '@roadpulse.test',
  '0209' || lpad(driver_number::text, 6, '0'),
  false,
  true
FROM generate_series(11, 110) AS driver_number
ON CONFLICT ("id") DO NOTHING;
