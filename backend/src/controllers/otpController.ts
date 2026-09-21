import { Response } from 'express';
import jwt from 'jsonwebtoken';
import OtpRequest from '../models/OtpRequest';
import Student from '../models/Student';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { generate6DigitOtp, hashOtp, verifyOtpHash } from '../utils/otpGenerator';
import { createAuditLog } from '../middleware/audit';

export const requestOtpAccess = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, reason } = req.body;
    const backupCoachId = req.user?.id;

    if (!studentId) {
      res.status(400).json({ success: false, message: 'Student ID is required' });
      return;
    }

    const student = await Student.findById(studentId).populate('primaryCoach');
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    if (!student.primaryCoach) {
      res.status(400).json({ success: false, message: 'Student does not have an assigned primary Success Coach' });
      return;
    }

    const assignedCoachId = (student.primaryCoach as any)._id.toString();

    // Check if backup coach is actually primary coach
    if (assignedCoachId === backupCoachId && req.user?.role !== 'admin') {
      res.status(400).json({
        success: false,
        message: 'You are the primary assigned coach for this student. Direct access is already granted.',
      });
      return;
    }

    // Auto-generate 6-digit single-use OTP
    const rawOtp = generate6DigitOtp();
    const otpHash = hashOtp(rawOtp);

    const ttlMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    const otpDoc = await OtpRequest.create({
      student: student._id,
      assignedCoach: assignedCoachId,
      backupCoach: backupCoachId,
      otpHash,
      plainOtp: rawOtp, // Transient display for assigned coach
      expiresAt,
      isUsed: false,
      reason: reason || 'Parent Visit / Primary Coach Unavailable',
    });

    await createAuditLog({
      actorId: backupCoachId,
      actorRole: req.user?.role,
      action: 'OTP_REQUEST_GENERATED',
      targetStudentId: student._id.toString(),
      details: `Temporary access OTP requested by Coach ${req.user?.name} for student ${student.collegeStudentId}`,
      status: 'SUCCESS',
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: `Single-use OTP generated successfully. Expires in ${ttlMinutes} minutes.`,
      otpRequestId: otpDoc._id,
      plainOtp: rawOtp, // In system UI, displayed to primary coach / demo view
      student: {
        id: student._id,
        collegeStudentId: student.collegeStudentId,
      },
      expiresAt,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error generating OTP request', error: error.message });
  }
};

export const verifyOtpAccess = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, otpCode } = req.body;
    const backupCoachId = req.user?.id;

    if (!studentId || !otpCode) {
      res.status(400).json({ success: false, message: 'Student ID and OTP Code are required' });
      return;
    }

    const student = await Student.findById(studentId);
    if (!student) {
      await createAuditLog({
        actorId: backupCoachId,
        actorRole: req.user?.role,
        action: 'OTP_VERIFY_FAILED',
        details: `OTP verification failed: Student ID '${studentId}' not found`,
        status: 'FAILED',
        ipAddress: req.ip,
      });
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    // Find latest pending OTP request for this student and backup coach
    const otpRequest = await OtpRequest.findOne({
      student: student._id,
      backupCoach: backupCoachId,
    }).sort({ createdAt: -1 });

    if (!otpRequest) {
      await createAuditLog({
        actorId: backupCoachId,
        actorRole: req.user?.role,
        action: 'OTP_VERIFY_FAILED',
        targetStudentId: student._id.toString(),
        details: `OTP verification failed for student ${student.collegeStudentId}: No active OTP request found for accessing coach`,
        status: 'FAILED',
        ipAddress: req.ip,
      });
      res.status(400).json({ success: false, message: 'No OTP request found for this student. Please request a new OTP.' });
      return;
    }

    // Check if OTP was already used
    if (otpRequest.isUsed) {
      await createAuditLog({
        actorId: backupCoachId,
        actorRole: req.user?.role,
        action: 'OTP_REUSE_ATTEMPT',
        targetStudentId: student._id.toString(),
        details: `SECURITY ALERT: Attempted to reuse already consumed single-use OTP for student ${student.collegeStudentId}`,
        status: 'UNAUTHORIZED',
        ipAddress: req.ip,
      });
      res.status(400).json({ success: false, message: 'Security Alert: This single-use OTP has already been used and is invalidated.' });
      return;
    }

    // Check if OTP is expired
    if (new Date() > otpRequest.expiresAt) {
      await createAuditLog({
        actorId: backupCoachId,
        actorRole: req.user?.role,
        action: 'OTP_EXPIRED_ATTEMPT',
        targetStudentId: student._id.toString(),
        details: `Attempted to verify expired OTP for student ${student.collegeStudentId}`,
        status: 'FAILED',
        ipAddress: req.ip,
      });
      res.status(400).json({ success: false, message: 'OTP has expired (10-minute limit exceeded). Please request a new OTP.' });
      return;
    }

    // Verify OTP code hash
    const isValid = verifyOtpHash(otpCode.trim(), otpRequest.otpHash);
    if (!isValid) {
      await createAuditLog({
        actorId: backupCoachId,
        actorRole: req.user?.role,
        action: 'OTP_VERIFY_FAILED',
        targetStudentId: student._id.toString(),
        details: `Incorrect OTP code entered for student ${student.collegeStudentId}`,
        status: 'FAILED',
        ipAddress: req.ip,
      });
      res.status(401).json({ success: false, message: 'Invalid OTP code. Please verify and try again.' });
      return;
    }

    // Mark OTP as used immediately (single-use enforcement)
    otpRequest.isUsed = true;
    otpRequest.verifiedAt = new Date();
    await otpRequest.save();

    // Create temporary 30-minute read-only access JWT token
    const secret = process.env.JWT_SECRET || 'super_secret_success_coach_jwt_key_2026_safe';
    const tempAccessMinutes = parseInt(process.env.TEMP_ACCESS_EXPIRY_MINUTES || '30', 10);

    const tempToken = jwt.sign(
      {
        id: req.user?.id,
        role: req.user?.role,
        email: req.user?.email,
        name: req.user?.name,
        collegeId: req.user?.collegeId,
        isTemporaryAccess: true,
        tempAccessStudentId: student._id.toString(),
      },
      secret as jwt.Secret,
      { expiresIn: '30m' }
    );

    await createAuditLog({
      actorId: backupCoachId,
      actorRole: req.user?.role,
      action: 'OTP_VERIFY_SUCCESS',
      targetStudentId: student._id.toString(),
      details: `SUCCESS: Backup Coach ${req.user?.name} granted temporary read-only access to student ${student.collegeStudentId} for ${tempAccessMinutes}m`,
      status: 'SUCCESS',
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'OTP verified successfully! Temporary read-only access granted.',
      tempToken,
      studentId: student._id,
      collegeStudentId: student.collegeStudentId,
      expiresInMinutes: tempAccessMinutes,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error verifying OTP', error: error.message });
  }
};

export const getPendingOtpRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const coachId = req.user?.id;

    // Fetch requests where coach is either assigned coach or requesting backup coach
    const requests = await OtpRequest.find({
      $or: [{ assignedCoach: coachId }, { backupCoach: coachId }],
    })
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name collegeId' },
      })
      .populate('assignedCoach', 'name collegeId department')
      .populate('backupCoach', 'name collegeId department')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, requests });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error fetching pending OTP requests', error: error.message });
  }
};
