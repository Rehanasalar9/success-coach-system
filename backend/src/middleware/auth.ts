import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser, UserRole } from '../models/User';
import Student from '../models/Student';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    email: string;
    name: string;
    collegeId: string;
  };
  tempAccessStudentId?: string; // If request carries valid backup OTP session token
}

interface JwtPayload {
  id: string;
  role: UserRole;
  email: string;
  name: string;
  collegeId: string;
  tempAccessStudentId?: string;
  isTemporaryAccess?: boolean;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Not authorized, token missing' });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'super_secret_success_coach_jwt_key_2026_safe';
    const decoded = jwt.verify(token, secret) as JwtPayload;

    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
      name: decoded.name,
      collegeId: decoded.collegeId,
    };

    if (decoded.isTemporaryAccess && decoded.tempAccessStudentId) {
      req.tempAccessStudentId = decoded.tempAccessStudentId;
    }

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Not authorized, invalid or expired token' });
    return;
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user?.role}' is not authorized to access this resource`,
      });
      return;
    }
    next();
  };
};

export const checkStudentAccess = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentIdParam = req.params.studentId || req.body.studentId;

    if (!studentIdParam) {
      res.status(400).json({ success: false, message: 'Student ID param or body field required' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    // Admin has full access to all student records
    if (req.user.role === 'admin') {
      next();
      return;
    }

    // Find student doc
    const student = await Student.findById(studentIdParam).populate('user');
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    // If logged in as Student role, student can only view their own profile
    if (req.user.role === 'student') {
      if (student.user._id.toString() !== req.user.id) {
        res.status(403).json({ success: false, message: 'Unauthorized access to another student profile' });
        return;
      }
      next();
      return;
    }

    // If logged in as Coach:
    if (req.user.role === 'coach') {
      // 1. Is primary assigned coach?
      if (student.primaryCoach && student.primaryCoach.toString() === req.user.id) {
        next();
        return;
      }

      // 2. Does coach have active temporary read-only access token for this student?
      if (req.tempAccessStudentId && req.tempAccessStudentId === student._id.toString()) {
        // If this is a modification attempt (POST/PUT/DELETE), block it!
        if (req.method !== 'GET') {
          res.status(403).json({
            success: false,
            message: 'Temporary OTP access is strictly READ-ONLY. Editing/deleting historical records is prohibited.',
          });
          return;
        }
        next();
        return;
      }

      res.status(403).json({
        success: false,
        message: 'Unauthorized: You are not the assigned primary Success Coach for this student. Please request a Parent Visit Backup OTP from the assigned coach.',
        requiresOtp: true,
        assignedCoachId: student.primaryCoach,
      });
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error checking student access permissions', error: error.message });
  }
};
