import { Router } from 'express';
import { getDriverAdvisories } from '../../controllers/advisories/roadAdvisories.controller.js';
import { driverRoleChecker } from '../../middleware/driverRoleChecker.js';
import { tokenCheck } from '../../middleware/tokenChecker.js';
const router = Router();
router.get('/', tokenCheck, driverRoleChecker, getDriverAdvisories);
export default router;
