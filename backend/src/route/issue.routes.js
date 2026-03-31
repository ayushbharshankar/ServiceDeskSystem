
import Express from 'express';
import {
  createIssue, getAllIssues, getIssueById,
  updateIssue, updateIssueStatus, deleteIssue,
  getMyTasks,
} from '../controller/issue.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Express.Router();

// All issue routes require auth
router.use(protect);

router.get('/my-tasks', getMyTasks);       // Must be before /:id
router.post('/',        createIssue);
router.get('/',         getAllIssues);
router.get('/:id',      getIssueById);
router.put('/:id',      updateIssue);
router.patch('/:id/status', updateIssueStatus);
router.delete('/:id',   deleteIssue);

export default router;
