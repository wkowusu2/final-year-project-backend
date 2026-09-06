import { Router } from 'express';

import { getDashboard, updateIncidentStatus } from '../../controllers/admin/dashboard.controller.js';
import { getSimulationStatus, postSimulationStart, postSimulationStop } from '../../controllers/admin/simulation.controller.js';
import { getAdminAdvisories, patchAdminAdvisory, postAdminAdvisory } from '../../controllers/advisories/roadAdvisories.controller.js';
import { adminRoleChecker } from '../../middleware/adminRoleChecker.js';
import { tokenCheck } from '../../middleware/tokenChecker.js';

const router = Router();

router.get('/dashboard', tokenCheck, adminRoleChecker, getDashboard);
router.patch('/incidents/:incidentId/status', tokenCheck, adminRoleChecker, updateIncidentStatus);
router.get('/road-advisories', tokenCheck, adminRoleChecker, getAdminAdvisories);
router.post('/road-advisories', tokenCheck, adminRoleChecker, postAdminAdvisory);
router.patch('/road-advisories/:advisoryId', tokenCheck, adminRoleChecker, patchAdminAdvisory);
router.get('/simulation', tokenCheck, adminRoleChecker, getSimulationStatus);
router.post('/simulation/start', tokenCheck, adminRoleChecker, postSimulationStart);
router.post('/simulation/stop', tokenCheck, adminRoleChecker, postSimulationStop);

export default router;
