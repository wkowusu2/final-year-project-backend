CREATE TYPE "public"."incident_severity" AS ENUM ('low', 'medium', 'high', 'critical');
--> statement-breakpoint
CREATE TYPE "public"."incident_status" AS ENUM ('pending', 'verified', 'resolved');
--> statement-breakpoint

CREATE TABLE "incidents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "reporter_driver_id" uuid NOT NULL,
  "type" varchar(80) NOT NULL,
  "description" text NOT NULL,
  "severity" "incident_severity" DEFAULT 'medium' NOT NULL,
  "status" "incident_status" DEFAULT 'pending' NOT NULL,
  "road_name" text NOT NULL,
  "city" text NOT NULL,
  "latitude" real NOT NULL,
  "longitude" real NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "incidents_reporter_driver_id_drivers_id_fk"
    FOREIGN KEY ("reporter_driver_id") REFERENCES "public"."drivers"("id")
    ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint

CREATE INDEX "incidents_created_at_idx" ON "incidents" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "incidents_status_created_at_idx" ON "incidents" USING btree ("status", "created_at");
