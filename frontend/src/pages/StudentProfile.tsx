import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coachApi } from '../services/api';
import { Student, Interaction } from '../types';
import { AddInteractionModal } from '../components/AddInteractionModal';
import {
  User,
  ShieldCheck,
  Calendar,
  Clock,
  PlusCircle,
  FileText,
  Phone,
  Mail,
  Award,
  AlertTriangle,
  ArrowLeft,
  Lock,
} from 'lucide-react';

interface StudentProfileProps {
  showToast: (type: 'success' | 'error', title: string, description?: string) => void;
}

export const StudentProfile: React.FC<StudentProfileProps> = ({ showToast }) => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [accessInfo, setAccessInfo] = useState<{
    isPrimaryCoach: boolean;
    hasTempAccess: boolean;
    isStudentSelf: boolean;
    canEdit: boolean;
    isReadOnly: boolean;
  } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (studentId) {
      loadProfileData(studentId);
    }
  }, [studentId]);

  const loadProfileData = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await coachApi.getStudentProfile(id);
      if (res.success) {
        setStudent(res.student);
        setInteractions(res.interactions);
        setAccessInfo(res.accessInfo);
      }
    } catch (err: any) {
      console.error(err);
      showToast('error', 'Profile Access Error', err.response?.data?.message || 'Failed to load student profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-slate-400">Loading student profile...</div>;
  }

  if (!student) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="text-red-400 font-bold text-lg">Student Profile Not Found</div>
        <button
          onClick={() => navigate('/coach')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const studentUser = student.user as any;
  const primaryCoach = student.primaryCoach as any;
  const classItem = student.class as any;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-all"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {/* Temporary Read-Only Security Banner */}
      {accessInfo?.isReadOnly && accessInfo?.hasTempAccess && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold">Backup Coach Temporary Read-Only Mode Active</span>
              <p className="text-[11px] text-amber-200/80">
                Authorized via single-use Parent Visit OTP. Historical records are strictly read-only.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-amber-500/20 rounded-md font-mono text-[11px]">Read-Only</span>
        </div>
      )}

      {/* Profile Summary Card Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Main Name & Badges */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-sky-500/20 shrink-0">
              {studentUser?.name?.charAt(0) || 'S'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{studentUser?.name}</h1>
                <span className="text-xs font-mono font-bold px-2.5 py-1 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-lg">
                  {student.collegeStudentId}
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-3">
                <span>Class: <strong className="text-slate-200">{classItem?.name || 'Computer Science'}</strong></span>
                <span>•</span>
                <span>Department: <strong className="text-slate-200">{classItem?.department || 'CS'}</strong></span>
              </div>
            </div>
          </div>

          {/* Action Button: Add Interaction */}
          <div>
            {accessInfo?.canEdit ? (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-600/30 transition-all"
              >
                <PlusCircle className="w-4 h-4" /> Record Session Log
              </button>
            ) : (
              <div className="text-xs text-slate-500 flex items-center gap-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <Lock className="w-4 h-4 text-slate-400" /> Read-Only Access Mode
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400">Assigned Success Coach</div>
            <div className="text-sm font-bold text-white mt-1">{primaryCoach?.name || 'Dr. Robert Smith'}</div>
            <div className="text-[11px] text-sky-400 mt-0.5">{primaryCoach?.email}</div>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400">Academic Status</div>
            <div className="mt-1">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  student.academicStatus === 'Excellent'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : student.academicStatus === 'Good'
                    ? 'bg-sky-500/20 text-sky-400'
                    : student.academicStatus === 'Average'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {student.academicStatus}
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400">Attendance Percentage</div>
            <div className="text-xl font-bold text-white mt-1">{student.attendancePercentage}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className={`h-full ${
                  student.attendancePercentage >= 90
                    ? 'bg-emerald-500'
                    : student.attendancePercentage >= 80
                    ? 'bg-sky-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${student.attendancePercentage}%` }}
              />
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400">Parent / Guardian Contact</div>
            <div className="text-sm font-bold text-white mt-1">{student.parentName}</div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3 text-slate-500" /> {student.parentPhone}
            </div>
          </div>
        </div>
      </div>

      {/* Interaction History Chronological Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Interaction History Timeline</h3>
            <p className="text-xs text-slate-400">Chronological record of student-coach session logs</p>
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
            {interactions.length} Total Sessions
          </span>
        </div>

        {interactions.length > 0 ? (
          <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-800">
            {interactions.map((item) => (
              <div key={item._id} className="relative pl-10 space-y-3">
                {/* Timeline Dot */}
                <div className="absolute left-2.5 top-1.5 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-sky-500 ring-4 ring-slate-900 shadow-md shadow-sky-500/50" />

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-all">
                  {/* Item Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-lg text-xs font-bold">
                        {item.interactionType}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(item.dateTime).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400">
                      Logged by: <strong className="text-slate-200">{(item.coach as any)?.name}</strong>
                    </div>
                  </div>

                  {/* Body grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                        Academic Progress
                      </div>
                      <p className="text-slate-200 mt-1">{item.academicProgress}</p>
                    </div>

                    <div>
                      <div className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                        Behavioural Observations
                      </div>
                      <p className="text-slate-200 mt-1">{item.behaviourNotes}</p>
                    </div>

                    <div>
                      <div className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                        Attendance Observations
                      </div>
                      <p className="text-slate-200 mt-1">{item.attendanceNotes}</p>
                    </div>

                    <div>
                      <div className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                        Topics Discussed
                      </div>
                      <p className="text-slate-200 mt-1">{item.topicsDiscussed}</p>
                    </div>
                  </div>

                  {/* Remarks & Follow-up box */}
                  <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                    <div className="text-xs text-slate-300">
                      <strong className="text-sky-400">Coach Remarks:</strong> {item.coachRemarks}
                    </div>

                    {item.followUpRequired && (
                      <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold pt-1 border-t border-slate-800">
                        <Clock className="w-3.5 h-3.5" /> Follow-Up Required
                        {item.followUpDate && (
                          <span className="text-slate-400 text-[11px]">
                            • Due by {new Date(item.followUpDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 text-xs">
            No interaction logs recorded for this student yet.
          </div>
        )}
      </div>

      {/* Add Interaction Session Modal */}
      {isAddModalOpen && (
        <AddInteractionModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          student={student}
          onSuccess={() => loadProfileData(studentId!)}
          showToast={showToast}
        />
      )}
    </div>
  );
};
