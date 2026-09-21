import { Router } from 'express';
import {
  getCoachDashboardMetrics,
  getAssignedStudents,
  searchStudentById,
  getStudentProfile,
} from '../controllers/coachController';
import { protect, authorize, checkStudentAccess } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/metrics', authorize('coach', 'admin'), getCoachDashboardMetrics);
router.get('/assigned-students', authorize('coach', 'admin'), getAssignedStudents);
router.get('/search-student', authorize('coach', 'admin'), searchStudentById);
router.get('/student-profile/:studentId', checkStudentAccess, getStudentProfile);

export default router;
