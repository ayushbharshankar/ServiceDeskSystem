
import Express from 'express';
import { addComment, getCommentsByIssue, deleteComment } from '../controller/comment.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Express.Router();

// All comment routes require auth
router.use(protect);

router.post('/',       addComment);
router.get('/',        getCommentsByIssue);
router.delete('/:id',  deleteComment);

export default router;
