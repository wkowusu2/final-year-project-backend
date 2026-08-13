CREATE TABLE "road_advisories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" varchar(160) NOT NULL,
  "description" text NOT NULL,
  "type" varchar(40) NOT NULL,
  "status" varchar(20) DEFAULT 'planned' NOT NULL,
  "impact" varchar(20) DEFAULT 'moderate' NOT NULL,
  "affected_road_osm_id" bigint,
  "road_name" text NOT NULL,
  "city" text NOT NULL,
  "latitude" real,
  "longitude" real,
  "starts_at" timestamp with time zone NOT NULL,
  "ends_at" timestamp with time zone,
  "published_by_admin_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "road_advisories" ADD CONSTRAINT "road_advisories_published_by_admin_id_admins_id_fk" FOREIGN KEY ("published_by_admin_id") REFERENCES "admins"("id") ON DELETE restrict;
--> statement-breakpoint
CREATE INDEX "road_advisories_status_starts_idx" ON "road_advisories" USING btree ("status", "starts_at");
