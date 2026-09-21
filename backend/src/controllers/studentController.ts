import { Response } from 'express';
import Student from '../models/Student';
import Interaction from '../models/Interaction';
import { AuthRequest } from '../middleware/auth';

export const getStudentDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId || req.user?.role !== 'student') {
      res.status(403).json({ success: false, message: 'Student role required' });
      return;
    }

    const student = await Student.findOne({ user: userId })
      .populate('user', 'name email collegeId phone department')
      .populate('class', 'name code department')
      .populate('primaryCoach', 'name email collegeId phone department');

    if (!student) {
      res.status(404).json({ success: false, message: 'Student record not found for this account' });
      return;
    }

    // Interaction history for student
    const interactions = await Interaction.find({ student: student._id })
      .populate('coach', 'name collegeId email department')
      .sort({ dateTime: -1 });

    // Pending follow-ups
    const followUps = interactions.filter((i) => i.followUpRequired);

    res.json({
      success: true,
      student,
      interactions,
      followUps,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error fetching student dashboard', error: error.message });
  }
};
