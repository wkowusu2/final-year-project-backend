import { Router } from 'express';

import { getDashboard, updateIncidentStatus } from '../../controllers/admin/dashboard.controller.js';
import { adminRoleChecker } from '../../middleware/adminRoleChecker.js';
import { tokenCheck } from '../../middleware/tokenChecker.js';

const router = Router();

router.get('/dashboard', tokenCheck, adminRoleChecker, getDashboard);
router.patch('/incidents/:incidentId/status', tokenCheck, adminRoleChecker, updateIncidentStatus);

export default router;
