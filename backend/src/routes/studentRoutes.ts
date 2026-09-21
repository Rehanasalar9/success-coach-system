import { Router } from 'express';
import { getStudentDashboard } from '../controllers/studentController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);
router.use(authorize('student', 'admin'));

router.get('/dashboard', getStudentDashboard);

export default router;
