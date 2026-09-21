import { Response } from 'express';
import Student from '../models/Student';
import Interaction from '../models/Interaction';
import OtpRequest from '../models/OtpRequest';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../middleware/audit';

export const getCoachDashboardMetrics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const coachId = req.user?.id;

    if (!coachId) {
      res.status(401).json({ success: false, message: 'Coach authentication required' });
      return;
    }

    // Total assigned students
    const totalAssignedStudents = await Student.countDocuments({ primaryCoach: coachId });

    // Today's start & end dates
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Today's interactions by this coach
    const todaysInteractions = await Interaction.countDocuments({
      coach: coachId,
      dateTime: { $gte: startOfDay, $lte: endOfDay },
    });

    // Recent interactions by this coach
    const recentInteractions = await Interaction.find({ coach: coachId })
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name collegeId' },
      })
      .sort({ dateTime: -1 })
      .limit(5);

    // Students requiring follow-up
    const followUpInteractions = await Interaction.find({
      coach: coachId,
      followUpRequired: true,
    })
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name collegeId' },
      })
      .sort({ followUpDate: 1 });

    // Parent visit / backup access activity involving this coach (either as backup coach or assigned coach)
    const parentVisitActivities = await OtpRequest.find({
      $or: [{ assignedCoach: coachId }, { backupCoach: coachId }],
    })
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name collegeId' },
      })
      .populate('assignedCoach', 'name collegeId')
      .populate('backupCoach', 'name collegeId')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      metrics: {
        totalAssignedStudents,
        todaysInteractions,
        recentInteractions,
        followUpInteractions,
        parentVisitActivities,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error fetching coach dashboard metrics', error: error.message });
  }
};

export const getAssignedStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const coachId = req.user?.id;

    const students = await Student.find({ primaryCoach: coachId })
      .populate('user', 'name email collegeId phone')
      .populate('class', 'name code department')
      .sort({ createdAt: -1 });

    res.json({ success: true, students });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error fetching assigned students', error: error.message });
  }
};

export const searchStudentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      res.status(400).json({ success: false, message: 'Search query string is required' });
      return;
    }

    const searchTerm = query.trim();

    // First search by collegeStudentId exact match or regex
    const students = await Student.find({
      collegeStudentId: { $regex: searchTerm, $options: 'i' },
    })
      .populate('user', 'name email collegeId phone')
      .populate('class', 'name code department')
      .populate('primaryCoach', 'name email collegeId phone department');

    const currentUserId = req.user?.id;

    const results = students.map((student) => {
      const isPrimaryCoach =
        req.user?.role === 'admin' ||
        (student.primaryCoach && (student.primaryCoach as any)._id.toString() === currentUserId);

      // Check if coach has active temp read-only access token for this student
      const hasTempAccess = req.tempAccessStudentId === student._id.toString();

      return {
        ...student.toObject(),
        isPrimaryCoach,
        hasTempAccess,
        requiresOtp: !isPrimaryCoach && !hasTempAccess,
      };
    });

    res.json({ success: true, count: results.length, students: results });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error searching students', error: error.message });
  }
};

export const getStudentProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId)
      .populate('user', 'name email collegeId phone department')
      .populate('class', 'name code department')
      .populate('primaryCoach', 'name email collegeId phone department');

    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found' });
      return;
    }

    const currentUserId = req.user?.id;
    const isPrimaryCoach =
      req.user?.role === 'admin' ||
      (student.primaryCoach && (student.primaryCoach as any)._id.toString() === currentUserId);

    const hasTempAccess = req.tempAccessStudentId === student._id.toString();
    const isStudentSelf = req.user?.role === 'student' && (student.user as any)._id.toString() === currentUserId;

    // Interaction history chronological
    const interactions = await Interaction.find({ student: student._id })
      .populate('coach', 'name collegeId email')
      .sort({ dateTime: -1 });

    // Record audit log for viewing profile
    if (!isStudentSelf) {
      await createAuditLog({
        actorId: req.user?.id,
        actorRole: req.user?.role,
        action: hasTempAccess ? 'TEMP_ACCESS_VIEW_PROFILE' : 'VIEW_STUDENT_PROFILE',
        targetStudentId: student._id.toString(),
        details: `${hasTempAccess ? '[BACKUP COACH TEMP ACCESS] ' : ''}Viewed profile for student ${student.collegeStudentId}`,
        status: 'SUCCESS',
        ipAddress: req.ip,
      });
    }

    res.json({
      success: true,
      student,
      interactions,
      accessInfo: {
        isPrimaryCoach,
        hasTempAccess,
        isStudentSelf,
        canEdit: isPrimaryCoach || req.user?.role === 'admin',
        isReadOnly: hasTempAccess || isStudentSelf,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error fetching student profile', error: error.message });
  }
};
