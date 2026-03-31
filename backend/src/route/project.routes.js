
import Express from 'express';
import {
  createProject, getAllProjects, getProjectById,
  updateProject, deleteProject,
  addMember, removeMember,
} from '../controller/project.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Express.Router();

// All project routes require auth
router.use(protect);

router.post('/',   authorize('Admin', 'Manager'), createProject);
router.get('/',    getAllProjects);
router.get('/:id', getProjectById);
router.put('/:id', authorize('Admin', 'Manager'), updateProject);
router.delete('/:id', authorize('Admin'),          deleteProject);

// Member management
router.post('/:id/members',          authorize('Admin', 'Manager'), addMember);
router.delete('/:id/members/:userId', authorize('Admin', 'Manager'), removeMember);

export default router;
