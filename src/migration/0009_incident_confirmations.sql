CREATE TABLE "incident_confirmations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "incident_id" uuid NOT NULL,
  "driver_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "incident_confirmations_incident_id_incidents_id_fk"
    FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id")
    ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "incident_confirmations_driver_id_drivers_id_fk"
    FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id")
    ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX "incident_confirmations_incident_driver_idx" ON "incident_confirmations" USING btree ("incident_id", "driver_id");
--> statement-breakpoint
CREATE INDEX "incident_confirmations_incident_idx" ON "incident_confirmations" USING btree ("incident_id");
