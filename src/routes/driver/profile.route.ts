import { Router } from 'express';
import { tokenCheck } from '../../middleware/tokenChecker.js';
import { driverRoleChecker } from '../../middleware/driverRoleChecker.js';
import { createDriverProfile, doneOnBoarding, getDriverProfileWithId } from '../../controllers/driver/profile.controller.js';

const router = Router();

router.post('/', tokenCheck, driverRoleChecker, createDriverProfile);
router.get('/', tokenCheck, driverRoleChecker, getDriverProfileWithId);
router.patch('/done-onboarding',  tokenCheck, driverRoleChecker, doneOnBoarding)


export default router