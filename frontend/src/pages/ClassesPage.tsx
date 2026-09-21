import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { ClassItem, User } from '../types';
import { BookOpen, UserCheck, PlusCircle } from 'lucide-react';

interface ClassesPageProps {
  showToast: (type: 'success' | 'error', title: string, description?: string) => void;
}

export const ClassesPage: React.FC<ClassesPageProps> = ({ showToast }) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [coaches, setCoaches] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resCl, resCo] = await Promise.all([adminApi.getClasses(), adminApi.getCoaches()]);
      if (resCl.success) setClasses(resCl.classes);
      if (resCo.success) setCoaches(resCo.coaches);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignCoach = async (classId: string, coachId: string) => {
    try {
      const res = await adminApi.assignCoachToClass(classId, coachId);
      if (res.success) {
        showToast('success', 'Class Reassigned', 'Assigned primary coach to class and all enrolled students');
        loadData();
      }
    } catch (err: any) {
      showToast('error', 'Assignment Error', err.response?.data?.message || 'Failed to assign coach');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-400" /> Academic Classes & Success Coach Assignments
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Every class section is assigned one primary Success Coach who manages the ~2 classes cohort.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((c) => (
          <div key={c._id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-white">{c.name}</h3>
                <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 bg-emerald-500/10 rounded-md">
                  {c.code}
                </span>
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-slate-950 border border-slate-800 text-slate-300 rounded-full">
                {c.studentCount || 0} Enrolled
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="text-slate-400 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-sky-400" /> Primary Success Coach:
              </div>
              <div className="font-bold text-white text-sm">
                {(c.primaryCoach as any)?.name || 'Unassigned'}
              </div>
              {(c.primaryCoach as any)?.email && (
                <div className="text-[11px] text-slate-400">{(c.primaryCoach as any).email}</div>
              )}
            </div>

            <div className="pt-2">
              <label className="block text-[11px] text-slate-400 mb-1">Reassign Primary Coach:</label>
              <select
                value={(c.primaryCoach as any)?._id || ''}
                onChange={(e) => handleAssignCoach(c._id, e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="">Select Coach</option>
                {coaches.map((coach: any) => (
                  <option key={coach._id} value={coach._id}>
                    {coach.name} ({coach.collegeId})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
