import { Router } from 'express';
import { getRoads } from '../../controllers/map/roads.controller.js';

const router = Router();

router.get('/roads', getRoads);

export default router;
