
import Express from 'express';
import { getAllUsers, getUserById, updateUser, deleteUser } from '../controller/user.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Express.Router();

router.use(protect);

router.get('/',     authorize('Admin', 'Manager'), getAllUsers);
router.get('/:id',  authorize('Admin', 'Manager'), getUserById);
router.put('/:id',  authorize('Admin'),            updateUser);
router.delete('/:id', authorize('Admin'),           deleteUser);

export default router;
