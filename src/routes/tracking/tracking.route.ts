import { Router } from 'express';
import { addPoints, completeTrackingSession, getActiveTrackingSession, startSession } from '../../controllers/tracking/tracking.controller.js';
import { driverRoleChecker } from '../../middleware/driverRoleChecker.js';
import { tokenCheck } from '../../middleware/tokenChecker.js';

const router = Router();

router.use(tokenCheck, driverRoleChecker);
router.post('/sessions', startSession);
router.get('/sessions/active', getActiveTrackingSession);
router.post('/sessions/:sessionId/points', addPoints);
router.post('/sessions/:sessionId/complete', completeTrackingSession);

export default router;
