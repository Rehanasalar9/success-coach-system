import React, { useState, useEffect } from 'react';
import { studentApi } from '../services/api';
import { Student, Interaction } from '../types';
import {
  UserCheck,
  Award,
  Calendar,
  Clock,
  BookOpen,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [followUps, setFollowUps] = useState<Interaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStudentDashboard();
  }, []);

  const loadStudentDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await studentApi.getDashboard();
      if (res.success) {
        setStudent(res.student);
        setInteractions(res.interactions);
        setFollowUps(res.followUps);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-slate-400">Loading student dashboard...</div>;
  }

  if (!student) {
    return <div className="p-12 text-center text-red-400">Student record not found.</div>;
  }

  const primaryCoach = student.primaryCoach as any;
  const classItem = student.class as any;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white">Welcome back, {(student.user as any)?.name}!</h2>
            <span className="text-xs font-mono px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-bold">
              {student.collegeStudentId}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track your academic development, attendance percentage, and Success Coach recommendations.
          </p>
        </div>

        <div className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-300">
          Enrolled Class: <strong className="text-sky-400 font-mono">{classItem?.code || 'CS-2026-A'}</strong>
        </div>
      </div>

      {/* Progress & Coach Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Assigned Coach */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-2xl">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Your Success Coach</div>
              <h3 className="text-lg font-bold text-white">{primaryCoach?.name || 'Dr. Robert Smith'}</h3>
            </div>
          </div>
          <div className="space-y-2 text-xs pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2 text-slate-300">
              <Mail className="w-3.5 h-3.5 text-sky-400" /> {primaryCoach?.email}
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Phone className="w-3.5 h-3.5 text-sky-400" /> {primaryCoach?.phone || '+1 (555) 234-5678'}
            </div>
            <div className="text-[11px] text-slate-400 pt-1">
              Department: {primaryCoach?.department || 'Computer Science'}
            </div>
          </div>
        </div>

        {/* Card 2: Academic Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Academic Development</div>
              <h3 className="text-lg font-bold text-emerald-400">{student.academicStatus}</h3>
            </div>
          </div>
          <div className="text-xs text-slate-400 pt-2 border-t border-slate-800">
            Keep up regular interaction sessions with your coach to maintain optimal academic growth.
          </div>
        </div>

        {/* Card 3: Attendance */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-2xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Attendance Percentage</div>
              <h3 className="text-2xl font-bold text-white">{student.attendancePercentage}%</h3>
            </div>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full transition-all"
              style={{ width: `${student.attendancePercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Interaction History Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Your Success Session Logs</h3>
            <p className="text-xs text-slate-400">Chronological interaction notes recorded by your Success Coach</p>
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
            {interactions.length} Sessions Logged
          </span>
        </div>

        {interactions.length > 0 ? (
          <div className="space-y-4">
            {interactions.map((item) => (
              <div key={item._id} className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-lg text-xs font-bold">
                      {item.interactionType}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(item.dateTime).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">Coach: {(item.coach as any)?.name}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <strong className="text-slate-400 block text-[10px] uppercase">Academic Progress</strong>
                    <p className="text-slate-200 mt-0.5">{item.academicProgress}</p>
                  </div>
                  <div>
                    <strong className="text-slate-400 block text-[10px] uppercase">Topics Discussed</strong>
                    <p className="text-slate-200 mt-0.5">{item.topicsDiscussed}</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300">
                  <strong className="text-sky-400">Coach Remarks & Guidance:</strong> {item.coachRemarks}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 text-xs">No session logs recorded yet.</div>
        )}
      </div>
    </div>
  );
};
