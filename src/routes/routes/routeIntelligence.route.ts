import { Router } from 'express';
import { getRouteIntelligence } from '../../controllers/routes/routeIntelligence.controller.js';
import { driverRoleChecker } from '../../middleware/driverRoleChecker.js';
import { tokenCheck } from '../../middleware/tokenChecker.js';

const router = Router();
router.get('/intelligence', tokenCheck, driverRoleChecker, getRouteIntelligence);
export default router;
