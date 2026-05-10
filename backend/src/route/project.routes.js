
import Express from 'express';
import {
  createProject, getAllProjects, getProjectById,
  updateProject, deleteProject,
  addMember, removeMember, getMembers,
  inviteMember, cancelInvitation,
  getProjectActivity, getProjectDashboard,
} from '../controller/project.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Express.Router();

router.use(protect);

router.post('/',   createProject);
router.get('/',    getAllProjects);
router.get('/:id', getProjectById);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

// Members
router.get('/:id/members',             getMembers);
router.post('/:id/members',            addMember);
router.delete('/:id/members/:userId',  removeMember);

// Invitations
router.post('/:id/invite',                        inviteMember);
router.delete('/:id/invitations/:invitationId',    cancelInvitation);

// Activity & Dashboard
router.get('/:id/activity',   getProjectActivity);
router.get('/:id/dashboard',  getProjectDashboard);

export default router;
