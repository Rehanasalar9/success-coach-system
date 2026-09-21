export type UserRole = 'admin' | 'coach' | 'student';
export type AcademicStatus = 'Excellent' | 'Good' | 'Average' | 'Needs Attention';
export type InteractionType = 'Academic' | 'Behavioural' | 'Attendance' | 'Career' | 'Personal' | 'Parent Meeting' | 'General';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  collegeId: string;
  department?: string;
  phone?: string;
  studentId?: string;
}

export interface ClassItem {
  _id: string;
  name: string;
  code: string;
  department: string;
  primaryCoach?: User;
  studentCount?: number;
}

export interface Student {
  _id: string;
  user: User;
  collegeStudentId: string;
  class?: ClassItem;
  primaryCoach?: User;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  academicStatus: AcademicStatus;
  attendancePercentage: number;
  createdAt: string;
  isPrimaryCoach?: boolean;
  hasTempAccess?: boolean;
  requiresOtp?: boolean;
}

export interface Interaction {
  _id: string;
  student: string | Student;
  coach: User;
  dateTime: string;
  interactionType: InteractionType;
  academicProgress: string;
  behaviourNotes: string;
  attendanceNotes: string;
  topicsDiscussed: string;
  coachRemarks: string;
  followUpRequired: boolean;
  followUpDate?: string;
  createdAt: string;
}

export interface OtpRequest {
  _id: string;
  student: Student;
  assignedCoach: User;
  backupCoach: User;
  otpHash: string;
  plainOtp?: string;
  expiresAt: string;
  isUsed: boolean;
  verifiedAt?: string;
  reason?: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  actor?: User;
  actorRole?: string;
  action: string;
  targetStudent?: Student;
  details: string;
  status: 'SUCCESS' | 'FAILED' | 'UNAUTHORIZED';
  ipAddress?: string;
  createdAt: string;
}

export interface CoachDashboardMetrics {
  totalAssignedStudents: number;
  todaysInteractions: number;
  recentInteractions: Interaction[];
  followUpInteractions: Interaction[];
  parentVisitActivities: OtpRequest[];
}
