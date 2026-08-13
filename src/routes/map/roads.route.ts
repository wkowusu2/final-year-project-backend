import { Router } from 'express';
import { getRoads, getTraffic } from '../../controllers/map/roads.controller.js';
import { tokenCheck } from '../../middleware/tokenChecker.js';

const router = Router();

router.get('/roads', getRoads);
// Traffic is aggregated road data, available to both authenticated drivers and admins.
router.get('/traffic', tokenCheck, getTraffic);

export default router;
