import { and, eq } from 'drizzle-orm';
import { getDb } from '../configs/db.config.js';
import { adminRefreshTokens } from '../schema/adminRefreshTokens.js';
import { admins } from '../schema/admins.js';

export async function getAdminByEmail(email: string) {
  const rows = await getDb().select().from(admins).where(and(eq(admins.email, email), eq(admins.deleted, false))).limit(1);
  return rows[0] ?? null;
}
export async function getAdminById(id: string) {
  const rows = await getDb().select().from(admins).where(and(eq(admins.id, id), eq(admins.deleted, false))).limit(1);
  return rows[0] ?? null;
}
export async function saveAdminRefreshToken(adminId: string, hashedRefreshToken: string) {
  await getDb().insert(adminRefreshTokens).values({ adminId, hashedRefreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
}
export async function getAdminRefreshToken(adminId: string, hashedRefreshToken: string) {
  const rows = await getDb().select().from(adminRefreshTokens).where(and(eq(adminRefreshTokens.adminId, adminId), eq(adminRefreshTokens.hashedRefreshToken, hashedRefreshToken), eq(adminRefreshTokens.revoked, false))).limit(1);
  return rows[0] ?? null;
}
export async function deleteAdminRefreshToken(adminId: string, hashedRefreshToken: string) {
  await getDb().delete(adminRefreshTokens).where(and(eq(adminRefreshTokens.adminId, adminId), eq(adminRefreshTokens.hashedRefreshToken, hashedRefreshToken)));
}
