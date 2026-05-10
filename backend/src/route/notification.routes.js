
import Express from 'express';
import {
  getNotifications, markAsRead, markAllAsRead, getUnreadCount,
} from '../controller/notification.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Express.Router();

router.use(protect);

router.get('/',              getNotifications);
router.get('/unread-count',  getUnreadCount);
router.patch('/read-all',    markAllAsRead);
router.patch('/:id/read',    markAsRead);

export default router;
