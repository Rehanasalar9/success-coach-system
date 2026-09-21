import { Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Student from '../models/Student';
import Class from '../models/Class';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../middleware/audit';

export const addCoach = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, collegeId, phone, department } = req.body;

    if (!name || !email || !password || !collegeId) {
      res.status(400).json({ success: false, message: 'Name, email, password, and College ID are required' });
      return;
    }

    const existingUser = await User.findOne({ $or: [{ email }, { collegeId }] });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'User with this email or College ID already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const coach = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'coach',
      collegeId: collegeId.toUpperCase().trim(),
      phone,
      department: department || 'General Academic',
    });

    await createAuditLog({
      actorId: req.user?.id,
      actorRole: req.user?.role,
      action: 'ADD_COACH',
      details: `Created new Success Coach: ${name} (${collegeId})`,
      status: 'SUCCESS',
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Success Coach created successfully',
      coach: {
        id: coach._id,
        name: coach.name,
        email: coach.email,
        collegeId: coach.collegeId,
        department: coach.department,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error adding Success Coach', error: error.message });
  }
};

export const getCoaches = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const coaches = await User.find({ role: 'coach' }).select('-password').sort({ name: 1 });

    const coachesWithCounts = await Promise.all(
      coaches.map(async (coach) => {
        const studentCount = await Student.countDocuments({ primaryCoach: coach._id });
        const assignedClasses = await Class.find({ primaryCoach: coach._id }).select('name code');
        return {
          ...coach.toObject(),
          assignedStudentsCount: studentCount,
          assignedClasses,
        };
      })
    );

    res.json({ success: true, coaches: coachesWithCounts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error fetching coaches', error: error.message });
  }
};

export const addStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      email,
      password,
      collegeStudentId,
      classId,
      primaryCoachId,
      parentName,
      parentPhone,
      parentEmail,
      academicStatus,
      attendancePercentage,
    } = req.body;

    if (!name || !email || !password || !collegeStudentId || !parentName || !parentPhone) {
      res.status(400).json({ success: false, message: 'Required student fields missing' });
      return;
    }

    const existingUser = await User.findOne({ $or: [{ email }, { collegeId: collegeStudentId }] });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'User with this email or Student ID already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userDoc = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'student',
      collegeId: collegeStudentId.toUpperCase().trim(),
    });

    const studentDoc = await Student.create({
      user: userDoc._id,
      collegeStudentId: collegeStudentId.toUpperCase().trim(),
      class: classId || undefined,
      primaryCoach: primaryCoachId || undefined,
      parentName,
      parentPhone,
      parentEmail,
      academicStatus: academicStatus || 'Good',
      attendancePercentage: attendancePercentage !== undefined ? attendancePercentage : 90,
    });

    await createAuditLog({
      actorId: req.user?.id,
      actorRole: req.user?.role,
      action: 'ADD_STUDENT',
      targetStudentId: studentDoc._id.toString(),
      details: `Registered new student: ${name} (${collegeStudentId})`,
      status: 'SUCCESS',
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      student: studentDoc,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error adding student', error: error.message });
  }
};

export const getStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const students = await Student.find()
      .populate('user', 'name email collegeId phone')
      .populate('class', 'name code department')
      .populate('primaryCoach', 'name email collegeId phone department')
      .sort({ createdAt: -1 });

    res.json({ success: true, students });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error fetching students', error: error.message });
  }
};

export const updateStudentAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { primaryCoachId, classId, academicStatus, attendancePercentage } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    if (primaryCoachId) student.primaryCoach = primaryCoachId;
    if (classId) student.class = classId;
    if (academicStatus) student.academicStatus = academicStatus;
    if (attendancePercentage !== undefined) student.attendancePercentage = attendancePercentage;

    await student.save();

    await createAuditLog({
      actorId: req.user?.id,
      actorRole: req.user?.role,
      action: 'REASSIGN_STUDENT',
      targetStudentId: student._id.toString(),
      details: `Updated assignment for student ${student.collegeStudentId}`,
      status: 'SUCCESS',
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Student assignment updated', student });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error updating student assignment', error: error.message });
  }
};

export const createClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, code, department, primaryCoachId } = req.body;

    if (!name || !code || !department) {
      res.status(400).json({ success: false, message: 'Class name, code, and department are required' });
      return;
    }

    const existingClass = await Class.findOne({ code: code.toUpperCase().trim() });
    if (existingClass) {
      res.status(400).json({ success: false, message: 'Class with this code already exists' });
      return;
    }

    const classDoc = await Class.create({
      name,
      code: code.toUpperCase().trim(),
      department,
      primaryCoach: primaryCoachId || undefined,
    });

    // If primary coach was selected, update all students in this class
    if (primaryCoachId) {
      await Student.updateMany({ class: classDoc._id }, { primaryCoach: primaryCoachId });
    }

    await createAuditLog({
      actorId: req.user?.id,
      actorRole: req.user?.role,
      action: 'CREATE_CLASS',
      details: `Created new class: ${name} (${code})`,
      status: 'SUCCESS',
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, class: classDoc });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error creating class', error: error.message });
  }
};

export const getClasses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const classes = await Class.find()
      .populate('primaryCoach', 'name email collegeId phone department')
      .sort({ code: 1 });

    const classesWithStudentCounts = await Promise.all(
      classes.map(async (c) => {
        const studentCount = await Student.countDocuments({ class: c._id });
        return {
          ...c.toObject(),
          studentCount,
        };
      })
    );

    res.json({ success: true, classes: classesWithStudentCounts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error fetching classes', error: error.message });
  }
};

export const assignCoachToClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;
    const { primaryCoachId } = req.body;

    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      res.status(404).json({ success: false, message: 'Class not found' });
      return;
    }

    classDoc.primaryCoach = primaryCoachId;
    await classDoc.save();

    // Update all students belonging to this class
    if (primaryCoachId) {
      await Student.updateMany({ class: classId }, { primaryCoach: primaryCoachId });
    }

    await createAuditLog({
      actorId: req.user?.id,
      actorRole: req.user?.role,
      action: 'ASSIGN_COACH_CLASS',
      details: `Assigned primary coach to class ${classDoc.code}`,
      status: 'SUCCESS',
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Primary coach assigned to class and enrolled students', class: classDoc });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error assigning coach to class', error: error.message });
  }
};

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const logs = await AuditLog.find()
      .populate('actor', 'name email role collegeId')
      .populate({
        path: 'targetStudent',
        populate: { path: 'user', select: 'name collegeId' },
      })
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error fetching audit logs', error: error.message });
  }
};
