
import Express from 'express';
import { register, login, logout, me } from '../controller/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, me);

export default router;