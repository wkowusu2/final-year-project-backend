import { desc, eq, inArray } from 'drizzle-orm';

import { getDb } from '../configs/db.config.js';
import { roadAdvisories } from '../schema/roadAdvisories.js';

export type AdvisoryStatus = 'planned' | 'active' | 'completed' | 'cancelled';
export type AdvisoryInput = {
  title: string; description: string; type: string; status: AdvisoryStatus; impact: 'low' | 'moderate' | 'high';
  affectedRoadOsmId: string | null; roadName: string; city: string; latitude: number | null; longitude: number | null;
  startsAt: Date; endsAt: Date | null;
};

function serialize(advisory: typeof roadAdvisories.$inferSelect) {
  return { ...advisory, affectedRoadOsmId: advisory.affectedRoadOsmId?.toString() ?? null };
}

export async function listAdminAdvisories() {
  const rows = await getDb().select().from(roadAdvisories).orderBy(desc(roadAdvisories.startsAt));
  return rows.map(serialize);
}

export async function listDriverAdvisories() {
  const rows = await getDb().select().from(roadAdvisories)
    .where(inArray(roadAdvisories.status, ['planned', 'active']))
    .orderBy(desc(roadAdvisories.startsAt));
  return rows.map(serialize);
}

export async function createRoadAdvisory(input: AdvisoryInput, adminId: string) {
  const rows = await getDb().insert(roadAdvisories).values({ ...input, affectedRoadOsmId: input.affectedRoadOsmId ? BigInt(input.affectedRoadOsmId) : null, publishedByAdminId: adminId }).returning();
  return rows[0] ? serialize(rows[0]) : null;
}

export async function updateRoadAdvisory(id: string, input: AdvisoryInput) {
  const rows = await getDb().update(roadAdvisories).set({ ...input, affectedRoadOsmId: input.affectedRoadOsmId ? BigInt(input.affectedRoadOsmId) : null, updatedAt: new Date() }).where(eq(roadAdvisories.id, id)).returning();
  return rows[0] ? serialize(rows[0]) : null;
}
