import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { deleteAdminRefreshToken, getAdminByEmail, getAdminById, getAdminRefreshToken } from '../../repository/adminAuth.js';
import { generateAdminTokens } from '../../service/jwtService.js';
import { hashToken } from '../../utils/cryptoHelper.js';

export async function adminLogin(req: Request, res: Response) {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) return res.status(400).json({ success: false, data: null, error: 'Email and password are required' });
  try {
    const admin = await getAdminByEmail(email.trim().toLowerCase());
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) return res.status(401).json({ success: false, data: null, error: 'Invalid email or password' });
    const tokens = await generateAdminTokens(admin.id, admin.email);
    if (!tokens._success || !tokens._data) throw new Error(tokens._error ?? 'Unable to create tokens');
    return res.status(200).json({ success: true, data: { ...tokens._data, admin: { id: admin.id, email: admin.email } }, error: null });
  } catch (error) {
    console.error('Unable to sign in administrator:', error);
    return res.status(500).json({ success: false, data: null, error: 'Unable to sign in administrator' });
  }
}

export async function refreshAdminTokens(req: Request, res: Response) {
  const { refreshToken, adminId } = req.body ?? {};
  if (typeof refreshToken !== 'string' || typeof adminId !== 'string') return res.status(400).json({ success: false, data: null, error: 'Refresh token and administrator identity are required' });
  try {
    const hashedToken = hashToken(refreshToken);
    const storedToken = await getAdminRefreshToken(adminId, hashedToken);
    if (!storedToken || storedToken.expiresAt < new Date()) {
      if (storedToken) await deleteAdminRefreshToken(adminId, hashedToken);
      return res.status(401).json({ success: false, data: null, error: 'Session expired' });
    }
    const admin = await getAdminById(adminId);
    if (!admin) return res.status(401).json({ success: false, data: null, error: 'Session expired' });
    await deleteAdminRefreshToken(adminId, hashedToken);
    const tokens = await generateAdminTokens(admin.id, admin.email);
    if (!tokens._success || !tokens._data) throw new Error(tokens._error ?? 'Unable to refresh tokens');
    return res.status(200).json({ success: true, data: tokens._data, error: null });
  } catch (error) {
    console.error('Unable to refresh administrator session:', error);
    return res.status(500).json({ success: false, data: null, error: 'Unable to refresh administrator session' });
  }
}
