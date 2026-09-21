import { Response } from 'express';
import Interaction from '../models/Interaction';
import Student from '../models/Student';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../middleware/audit';

export const addInteraction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      studentId,
      dateTime,
      interactionType,
      academicProgress,
      behaviourNotes,
      attendanceNotes,
      topicsDiscussed,
      coachRemarks,
      followUpRequired,
      followUpDate,
    } = req.body;

    if (
      !studentId ||
      !interactionType ||
      !academicProgress ||
      !behaviourNotes ||
      !attendanceNotes ||
      !topicsDiscussed ||
      !coachRemarks
    ) {
      res.status(400).json({ success: false, message: 'All required interaction fields must be provided' });
      return;
    }

    // Double-check temporary access: Backup coaches cannot add/edit historical records
    if (req.tempAccessStudentId && req.tempAccessStudentId === studentId) {
      res.status(403).json({
        success: false,
        message: 'Security Restriction: Backup coaches with temporary OTP access cannot add or modify interaction records.',
      });
      return;
    }

    const student = await Student.findById(studentId);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    const interaction = await Interaction.create({
      student: studentId,
      coach: req.user?.id,
      dateTime: dateTime ? new Date(dateTime) : new Date(),
      interactionType,
      academicProgress,
      behaviourNotes,
      attendanceNotes,
      topicsDiscussed,
      coachRemarks,
      followUpRequired: !!followUpRequired,
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
    });

    const populatedInteraction = await Interaction.findById(interaction._id).populate(
      'coach',
      'name collegeId email'
    );

    await createAuditLog({
      actorId: req.user?.id,
      actorRole: req.user?.role,
      action: 'ADD_INTERACTION',
      targetStudentId: student._id.toString(),
      details: `Logged ${interactionType} interaction for student ${student.collegeStudentId}`,
      status: 'SUCCESS',
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Interaction recorded successfully',
      interaction: populatedInteraction,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error adding interaction record', error: error.message });
  }
};

export const getStudentInteractions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;

    const interactions = await Interaction.find({ student: studentId })
      .populate('coach', 'name collegeId email department')
      .sort({ dateTime: -1 });

    res.json({ success: true, count: interactions.length, interactions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error fetching interaction history', error: error.message });
  }
};
