ALTER TABLE "gps_points" ADD COLUMN "matched_road_osm_id" bigint;
--> statement-breakpoint
ALTER TABLE "gps_points" ADD COLUMN "match_distance_meters" real;
--> statement-breakpoint
ALTER TABLE "gps_points" ADD COLUMN "matched_position" geometry(Point,4326);
--> statement-breakpoint
CREATE INDEX "gps_points_matched_road_recorded_idx"
ON "gps_points" USING btree ("matched_road_osm_id", "recorded_at")
WHERE "matched_road_osm_id" IS NOT NULL;
