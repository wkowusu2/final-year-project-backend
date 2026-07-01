import { Router } from 'express';
import { refreshToken, sendOtp, verifyOtp } from '../../controllers/auth/auth.controller.js';

const router = Router();

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/refresh', refreshToken)

export default router;