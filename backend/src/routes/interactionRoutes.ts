import { Router } from 'express';
import { addInteraction, getStudentInteractions } from '../controllers/interactionController';
import { protect, authorize, checkStudentAccess } from '../middleware/auth';

const router = Router();

router.use(protect);

router.post('/', authorize('coach', 'admin'), checkStudentAccess, addInteraction);
router.get('/student/:studentId', checkStudentAccess, getStudentInteractions);

export default router;
