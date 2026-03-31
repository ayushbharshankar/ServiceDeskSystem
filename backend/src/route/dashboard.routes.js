
import Express from 'express';
import { getDashboard } from '../controller/dashboard.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Express.Router();

router.get('/', protect, getDashboard);

export default router;
