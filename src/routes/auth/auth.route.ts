import { Router } from 'express';
import { refreshToken, sendOtp, verifyOtp } from '../../controllers/auth/auth.controller.js';
import { adminLogin, refreshAdminTokens } from '../../controllers/auth/adminAuth.controller.js';

const router = Router();

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/refresh', refreshToken)
router.post('/admin/login', adminLogin);
router.post('/admin/refresh', refreshAdminTokens);

export default router;
