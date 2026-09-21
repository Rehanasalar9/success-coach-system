import { Router } from 'express';
import {
  addCoach,
  getCoaches,
  addStudent,
  getStudents,
  updateStudentAssignment,
  createClass,
  getClasses,
  assignCoachToClass,
  getAuditLogs,
} from '../controllers/adminController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// Protect all admin routes
router.use(protect);
router.use(authorize('admin'));

router.post('/coaches', addCoach);
router.get('/coaches', getCoaches);

router.post('/students', addStudent);
router.get('/students', getStudents);
router.put('/students/:studentId/assign', updateStudentAssignment);

router.post('/classes', createClass);
router.get('/classes', getClasses);
router.put('/classes/:classId/assign-coach', assignCoachToClass);

router.get('/audit-logs', getAuditLogs);

export default router;
