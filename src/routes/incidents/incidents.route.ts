import { Router } from 'express';

import { confirmDriverIncident, createDriverIncident, getIncident, getIncidentsForMap, getMyIncidents } from '../../controllers/incidents/incidents.controller.js';
import { driverRoleChecker } from '../../middleware/driverRoleChecker.js';
import { tokenCheck } from '../../middleware/tokenChecker.js';
import { incidentUpload } from '../../middleware/incidentUpload.js';

const router = Router();

router.post('/', tokenCheck, driverRoleChecker, incidentUpload.single('photo'), createDriverIncident);
router.get('/', tokenCheck, driverRoleChecker, getMyIncidents);
router.get('/map', tokenCheck, driverRoleChecker, getIncidentsForMap);
router.post('/:incidentId/confirm', tokenCheck, driverRoleChecker, confirmDriverIncident);
router.get('/:incidentId', tokenCheck, driverRoleChecker, getIncident);

export default router;
