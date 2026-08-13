import { Router } from 'express';

import { getDashboard } from '../../controllers/admin/dashboard.controller.js';
import { adminRoleChecker } from '../../middleware/adminRoleChecker.js';
import { tokenCheck } from '../../middleware/tokenChecker.js';

const router = Router();

router.get('/dashboard', tokenCheck, adminRoleChecker, getDashboard);

export default router;
