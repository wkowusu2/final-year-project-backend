import { Router } from 'express';

import { createDriverIncident } from '../../controllers/incidents/incidents.controller.js';
import { driverRoleChecker } from '../../middleware/driverRoleChecker.js';
import { tokenCheck } from '../../middleware/tokenChecker.js';

const router = Router();

router.post('/', tokenCheck, driverRoleChecker, createDriverIncident);

export default router;
