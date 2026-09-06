-- Dedicated identities for the admin-controlled traffic simulation.
-- These rows intentionally contain no tracking sessions or GPS points. The
-- simulation service will use the fixed UUIDs below when it creates its data.
-- All values are idempotent, so the migration is safe to apply once through
-- Drizzle and harmless to review/run again in an isolated development database.

INSERT INTO "users" ("id", "phone", "role") VALUES
  ('10000000-0000-4000-8000-000000000001', '0209000001', 'driver'),
  ('10000000-0000-4000-8000-000000000002', '0209000002', 'driver'),
  ('10000000-0000-4000-8000-000000000003', '0209000003', 'driver'),
  ('10000000-0000-4000-8000-000000000004', '0209000004', 'driver'),
  ('10000000-0000-4000-8000-000000000005', '0209000005', 'driver'),
  ('10000000-0000-4000-8000-000000000006', '0209000006', 'driver'),
  ('10000000-0000-4000-8000-000000000007', '0209000007', 'driver'),
  ('10000000-0000-4000-8000-000000000008', '0209000008', 'driver'),
  ('10000000-0000-4000-8000-000000000009', '0209000009', 'driver'),
  ('10000000-0000-4000-8000-000000000010', '0209000010', 'driver')
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint

INSERT INTO "drivers" ("id", "full_name", "email", "phone", "deleted", "on_boarding_done") VALUES
  ('10000000-0000-4000-8000-000000000001', 'Simulation Driver 01', 'simulation.driver01@roadpulse.test', '0209000001', false, true),
  ('10000000-0000-4000-8000-000000000002', 'Simulation Driver 02', 'simulation.driver02@roadpulse.test', '0209000002', false, true),
  ('10000000-0000-4000-8000-000000000003', 'Simulation Driver 03', 'simulation.driver03@roadpulse.test', '0209000003', false, true),
  ('10000000-0000-4000-8000-000000000004', 'Simulation Driver 04', 'simulation.driver04@roadpulse.test', '0209000004', false, true),
  ('10000000-0000-4000-8000-000000000005', 'Simulation Driver 05', 'simulation.driver05@roadpulse.test', '0209000005', false, true),
  ('10000000-0000-4000-8000-000000000006', 'Simulation Driver 06', 'simulation.driver06@roadpulse.test', '0209000006', false, true),
  ('10000000-0000-4000-8000-000000000007', 'Simulation Driver 07', 'simulation.driver07@roadpulse.test', '0209000007', false, true),
  ('10000000-0000-4000-8000-000000000008', 'Simulation Driver 08', 'simulation.driver08@roadpulse.test', '0209000008', false, true),
  ('10000000-0000-4000-8000-000000000009', 'Simulation Driver 09', 'simulation.driver09@roadpulse.test', '0209000009', false, true),
  ('10000000-0000-4000-8000-000000000010', 'Simulation Driver 10', 'simulation.driver10@roadpulse.test', '0209000010', false, true)
ON CONFLICT ("id") DO NOTHING;
