CREATE TYPE "public"."tracking_session_status" AS ENUM('active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "gps_points" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"position" geometry(Point,4326) NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"speed_mps" real,
	"heading_degrees" real,
	"accuracy_meters" real
);
--> statement-breakpoint
CREATE TABLE "tracking_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"status" "tracking_session_status" DEFAULT 'active' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gps_points" ADD CONSTRAINT "gps_points_session_id_tracking_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."tracking_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_sessions" ADD CONSTRAINT "tracking_sessions_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gps_points_session_recorded_idx" ON "gps_points" USING btree ("session_id","recorded_at");--> statement-breakpoint
CREATE INDEX "gps_points_position_gist_idx" ON "gps_points" USING gist ("position");--> statement-breakpoint
CREATE INDEX "tracking_sessions_driver_started_idx" ON "tracking_sessions" USING btree ("driver_id","started_at");--> statement-breakpoint
CREATE INDEX "tracking_sessions_status_started_idx" ON "tracking_sessions" USING btree ("status","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tracking_sessions_one_active_driver_idx" ON "tracking_sessions" USING btree ("driver_id") WHERE "tracking_sessions"."status" = 'active';