import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import { connectDB, closeDB } from './config/db';
import User from './models/User';
import Class from './models/Class';
import Student from './models/Student';
import Interaction from './models/Interaction';
import AuditLog from './models/AuditLog';
import OtpRequest from './models/OtpRequest';

export const seedDatabase = async (): Promise<void> => {
  try {
    await connectDB();

    console.log('🧹 Clearing existing collections...');
    await User.deleteMany({});
    await Class.deleteMany({});
    await Student.deleteMany({});
    await Interaction.deleteMany({});
    await AuditLog.deleteMany({});
    await OtpRequest.deleteMany({});

    console.log('🔑 Creating password hashes...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const coachPassword = await bcrypt.hash('coach123', 10);
    const studentPassword = await bcrypt.hash('student123', 10);

    console.log('👤 Creating Users...');
    // 1. Admin
    const adminUser = await User.create({
      name: 'College Dean Administration',
      email: 'admin@college.edu',
      password: adminPassword,
      role: 'admin',
      collegeId: 'ADM001',
      department: 'College Administration',
      phone: '+1 (555) 019-2831',
    });

    // 2. Coaches
    const coachSmith = await User.create({
      name: 'Dr. Robert Smith',
      email: 'coach.smith@college.edu',
      password: coachPassword,
      role: 'coach',
      collegeId: 'COA101',
      department: 'Computer Science',
      phone: '+1 (555) 234-5678',
    });

    const coachDavis = await User.create({
      name: 'Prof. Sarah Davis',
      email: 'coach.davis@college.edu',
      password: coachPassword,
      role: 'coach',
      collegeId: 'COA102',
      department: 'Computer Science',
      phone: '+1 (555) 876-5432',
    });

    // 3. Classes
    console.log('🏫 Creating Classes...');
    const classA = await Class.create({
      name: 'Computer Science 2026 - Section A',
      code: 'CS-2026-A',
      department: 'Computer Science',
      primaryCoach: coachSmith._id,
    });

    const classB = await Class.create({
      name: 'Computer Science 2026 - Section B',
      code: 'CS-2026-B',
      department: 'Computer Science',
      primaryCoach: coachDavis._id,
    });

    // 4. Students & User Accounts
    console.log('🎓 Creating Students...');
    const studentUser1 = await User.create({
      name: 'Alex Rivera',
      email: 'alex.rivera@student.college.edu',
      password: studentPassword,
      role: 'student',
      collegeId: 'STU-2026-001',
      department: 'Computer Science',
      phone: '+1 (555) 111-2222',
    });

    const student1 = await Student.create({
      user: studentUser1._id,
      collegeStudentId: 'STU-2026-001',
      class: classA._id,
      primaryCoach: coachSmith._id,
      parentName: 'Maria Rivera',
      parentPhone: '+1 (555) 999-1001',
      parentEmail: 'maria.rivera@gmail.com',
      academicStatus: 'Excellent',
      attendancePercentage: 96,
    });

    const studentUser2 = await User.create({
      name: 'Jordan Chen',
      email: 'jordan.chen@student.college.edu',
      password: studentPassword,
      role: 'student',
      collegeId: 'STU-2026-002',
      department: 'Computer Science',
      phone: '+1 (555) 111-3333',
    });

    const student2 = await Student.create({
      user: studentUser2._id,
      collegeStudentId: 'STU-2026-002',
      class: classA._id,
      primaryCoach: coachSmith._id,
      parentName: 'David Chen',
      parentPhone: '+1 (555) 999-1002',
      parentEmail: 'david.chen@yahoo.com',
      academicStatus: 'Needs Attention',
      attendancePercentage: 78,
    });

    const studentUser3 = await User.create({
      name: 'Taylor Morgan',
      email: 'taylor.morgan@student.college.edu',
      password: studentPassword,
      role: 'student',
      collegeId: 'STU-2026-003',
      department: 'Computer Science',
      phone: '+1 (555) 111-4444',
    });

    const student3 = await Student.create({
      user: studentUser3._id,
      collegeStudentId: 'STU-2026-003',
      class: classB._id,
      primaryCoach: coachDavis._id,
      parentName: 'Arthur Morgan',
      parentPhone: '+1 (555) 999-1003',
      parentEmail: 'amorgan@outlook.com',
      academicStatus: 'Good',
      attendancePercentage: 91,
    });

    const studentUser4 = await User.create({
      name: 'Sam Vance',
      email: 'sam.vance@student.college.edu',
      password: studentPassword,
      role: 'student',
      collegeId: 'STU-2026-004',
      department: 'Computer Science',
      phone: '+1 (555) 111-5555',
    });

    const student4 = await Student.create({
      user: studentUser4._id,
      collegeStudentId: 'STU-2026-004',
      class: classB._id,
      primaryCoach: coachDavis._id,
      parentName: 'Karen Vance',
      parentPhone: '+1 (555) 999-1004',
      parentEmail: 'karen.vance@gmail.com',
      academicStatus: 'Average',
      attendancePercentage: 84,
    });

    // 5. Interactions
    console.log('📝 Creating Session Interactions...');
    await Interaction.create([
      {
        student: student1._id,
        coach: coachSmith._id,
        dateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        interactionType: 'Academic',
        academicProgress: 'GPA: 3.9/4.0. Scored 98% in Data Structures midterm.',
        behaviourNotes: 'Punctual, enthusiastic, leads group project discussions.',
        attendanceNotes: 'Attended 24/25 lectures. High class engagement.',
        topicsDiscussed: 'Honors research project application & internship options.',
        coachRemarks: 'Outstanding student! Encouraged Alex to apply for undergraduate research fellowship.',
        followUpRequired: false,
      },
      {
        student: student2._id,
        coach: coachSmith._id,
        dateTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        interactionType: 'Attendance',
        academicProgress: 'GPA: 2.3/4.0. Struggling with Algorithms assignment 3.',
        behaviourNotes: 'Appears stressed and quiet during lab sessions.',
        attendanceNotes: 'Missed 3 consecutive morning classes this fortnight.',
        topicsDiscussed: 'Time management, morning attendance, tutoring resources.',
        coachRemarks: 'Referred Jordan to Peer Tutoring Center. Follow-up meeting scheduled next week.',
        followUpRequired: true,
        followUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
      {
        student: student3._id,
        coach: coachDavis._id,
        dateTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        interactionType: 'Career',
        academicProgress: 'GPA: 3.5/4.0. Solid performance in Software Engineering.',
        behaviourNotes: 'Collaborative team player in group sprints.',
        attendanceNotes: 'Regular attendance with 91% record.',
        topicsDiscussed: 'Resume polishing and tech career fair preparation.',
        coachRemarks: 'Reviewed resume draft and gave feedback on portfolio projects.',
        followUpRequired: false,
      },
    ]);

    // 6. Audit Logs
    console.log('📋 Creating Initial System Audit Logs...');
    await AuditLog.create([
      {
        actor: adminUser._id,
        actorRole: 'admin',
        action: 'SYSTEM_INITIALIZATION',
        details: 'System seeded with initial college departments, coaches, classes, and student profiles',
        status: 'SUCCESS',
        ipAddress: '127.0.0.1',
      },
      {
        actor: coachSmith._id,
        actorRole: 'coach',
        action: 'ADD_INTERACTION',
        targetStudent: student1._id,
        details: 'Logged Academic interaction session for student STU-2026-001',
        status: 'SUCCESS',
        ipAddress: '127.0.0.1',
      },
    ]);

    console.log('✨ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
};

if (require.main === module) {
  seedDatabase().then(() => closeDB());
}
