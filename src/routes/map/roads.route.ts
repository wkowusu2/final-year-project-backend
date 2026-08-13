import { Router } from 'express';
import { getRoads, getTraffic } from '../../controllers/map/roads.controller.js';
import { driverRoleChecker } from '../../middleware/driverRoleChecker.js';
import { tokenCheck } from '../../middleware/tokenChecker.js';

const router = Router();

router.get('/roads', getRoads);
router.get('/traffic', tokenCheck, driverRoleChecker, getTraffic);

export default router;
