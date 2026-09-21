import { Router } from 'express';
import { requestOtpAccess, verifyOtpAccess, getPendingOtpRequests } from '../controllers/otpController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);
router.use(authorize('coach', 'admin'));

router.post('/request', requestOtpAccess);
router.post('/verify', verifyOtpAccess);
router.get('/pending', getPendingOtpRequests);

export default router;
