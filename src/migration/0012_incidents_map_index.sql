CREATE INDEX "incidents_map_bounds_idx" ON "incidents" USING btree ("latitude", "longitude", "created_at");
