import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { User, Student, ClassItem, AuditLog } from '../types';
import { StatCard } from '../components/StatCard';
import { Modal } from '../components/Modal';
import {
  Users,
  UserCheck,
  BookOpen,
  History,
  PlusCircle,
  Edit,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface AdminDashboardProps {
  showToast: (type: 'success' | 'error', title: string, description?: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ showToast }) => {
  const [coaches, setCoaches] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'coaches' | 'students' | 'classes' | 'audit'>('coaches');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isAddCoachOpen, setIsAddCoachOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);

  // Forms state
  const [coachForm, setCoachForm] = useState({
    name: '',
    email: '',
    password: 'coach123',
    collegeId: '',
    phone: '',
    department: 'Computer Science',
  });

  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    password: 'student123',
    collegeStudentId: '',
    classId: '',
    primaryCoachId: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    academicStatus: 'Good',
    attendancePercentage: 90,
  });

  const [classForm, setClassForm] = useState({
    name: '',
    code: '',
    department: 'Computer Science',
    primaryCoachId: '',
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [resC, resS, resCl, resA] = await Promise.all([
        adminApi.getCoaches(),
        adminApi.getStudents(),
        adminApi.getClasses(),
        adminApi.getAuditLogs(),
      ]);

      if (resC.success) setCoaches(resC.coaches);
      if (resS.success) setStudents(resS.students);
      if (resCl.success) setClasses(resCl.classes);
      if (resA.success) setAuditLogs(resA.logs);
    } catch (err) {
      console.error(err);
      showToast('error', 'Admin Error', 'Failed to load system records');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminApi.addCoach(coachForm);
      if (res.success) {
        showToast('success', 'Coach Added', `Created coach profile for ${coachForm.name}`);
        setIsAddCoachOpen(false);
        loadAdminData();
        setCoachForm({
          name: '',
          email: '',
          password: 'coach123',
          collegeId: '',
          phone: '',
          department: 'Computer Science',
        });
      }
    } catch (err: any) {
      showToast('error', 'Error Creating Coach', err.response?.data?.message || 'Failed to create coach');
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminApi.addStudent(studentForm);
      if (res.success) {
        showToast('success', 'Student Registered', `Registered student ${studentForm.collegeStudentId}`);
        setIsAddStudentOpen(false);
        loadAdminData();
      }
    } catch (err: any) {
      showToast('error', 'Error Creating Student', err.response?.data?.message || 'Failed to register student');
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminApi.createClass(classForm);
      if (res.success) {
        showToast('success', 'Class Created', `Created class ${classForm.code}`);
        setIsAddClassOpen(false);
        loadAdminData();
      }
    } catch (err: any) {
      showToast('error', 'Error Creating Class', err.response?.data?.message || 'Failed to create class');
    }
  };

  const handleAssignCoachToClass = async (classId: string, coachId: string) => {
    try {
      const res = await adminApi.assignCoachToClass(classId, coachId);
      if (res.success) {
        showToast('success', 'Coach Reassigned', 'Updated primary coach for class and students');
        loadAdminData();
      }
    } catch (err: any) {
      showToast('error', 'Reassignment Error', err.response?.data?.message || 'Failed to reassign coach');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">System Administration Dashboard</h2>
          <p className="text-xs text-slate-400">
            Manage college classes, assign Success Coaches, register students, and inspect system audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddCoachOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Add Coach
          </button>
          <button
            onClick={() => setIsAddStudentOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-sky-600/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Add Student
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Success Coaches" value={coaches.length} icon={UserCheck} color="purple" />
        <StatCard title="Enrolled Students" value={students.length} icon={Users} color="blue" />
        <StatCard title="College Classes" value={classes.length} icon={BookOpen} color="emerald" />
        <StatCard title="Audit Log Entries" value={auditLogs.length} icon={History} color="amber" />
      </div>

      {/* Main Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex border-b border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('coaches')}
            className={`pb-3 px-4 transition-all border-b-2 ${
              activeTab === 'coaches'
                ? 'border-purple-500 text-purple-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Success Coaches ({coaches.length})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`pb-3 px-4 transition-all border-b-2 ${
              activeTab === 'students'
                ? 'border-purple-500 text-purple-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Student Roster ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('classes')}
            className={`pb-3 px-4 transition-all border-b-2 ${
              activeTab === 'classes'
                ? 'border-purple-500 text-purple-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Classes & Coach Assignments ({classes.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 px-4 transition-all border-b-2 ${
              activeTab === 'audit'
                ? 'border-purple-500 text-purple-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Audit Logs Preview ({auditLogs.length})
          </button>
        </div>

        {/* Tab 1: Coaches List */}
        {activeTab === 'coaches' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 rounded-l-xl">Coach Name</th>
                  <th className="p-3.5">College ID</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Assigned Class(es)</th>
                  <th className="p-3.5 text-right rounded-r-xl">Assigned Students</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {coaches.map((c: any) => (
                  <tr key={c._id} className="hover:bg-slate-800/40 transition-all">
                    <td className="p-3.5 font-bold text-white">
                      <div>{c.name}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{c.email}</div>
                    </td>
                    <td className="p-3.5 font-mono text-purple-400">{c.collegeId}</td>
                    <td className="p-3.5 text-slate-300">{c.department}</td>
                    <td className="p-3.5">
                      {c.assignedClasses?.map((cls: any) => (
                        <span
                          key={cls._id}
                          className="mr-1 px-2 py-0.5 bg-slate-800 text-sky-400 rounded text-[11px] font-mono"
                        >
                          {cls.code}
                        </span>
                      ))}
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-200">{c.assignedStudentsCount} Students</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Students List */}
        {activeTab === 'students' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 rounded-l-xl">Student Name</th>
                  <th className="p-3.5">College ID</th>
                  <th className="p-3.5">Assigned Class</th>
                  <th className="p-3.5">Primary Success Coach</th>
                  <th className="p-3.5">Parent Details</th>
                  <th className="p-3.5 text-right rounded-r-xl">Reassign Coach</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-800/40 transition-all">
                    <td className="p-3.5 font-bold text-white">{(s.user as any)?.name}</td>
                    <td className="p-3.5 font-mono text-sky-400">{s.collegeStudentId}</td>
                    <td className="p-3.5 text-slate-300">{(s.class as any)?.code || 'Unassigned'}</td>
                    <td className="p-3.5 font-semibold text-slate-200">
                      {(s.primaryCoach as any)?.name || 'Dr. Robert Smith'}
                    </td>
                    <td className="p-3.5 text-slate-400 text-[11px]">
                      {s.parentName} ({s.parentPhone})
                    </td>
                    <td className="p-3.5 text-right">
                      <select
                        value={(s.primaryCoach as any)?._id || ''}
                        onChange={(e) =>
                          adminApi
                            .updateStudentAssignment(s._id, { primaryCoachId: e.target.value })
                            .then(() => {
                              showToast('success', 'Coach Reassigned', `Updated coach for ${s.collegeStudentId}`);
                              loadAdminData();
                            })
                        }
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none"
                      >
                        <option value="">Select Coach</option>
                        {coaches.map((c: any) => (
                          <option key={c._id} value={c._id}>
                            {c.name} ({c.collegeId})
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Classes List */}
        {activeTab === 'classes' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setIsAddClassOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
              >
                <PlusCircle className="w-4 h-4" /> Create New Class
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classes.map((cls) => (
                <div key={cls._id} className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-base text-white">{cls.name}</h4>
                      <span className="text-xs font-mono text-emerald-400 font-bold">{cls.code}</span>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg">
                      {cls.studentCount || 0} Students
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Primary Coach:</span>
                    <select
                      value={(cls.primaryCoach as any)?._id || ''}
                      onChange={(e) => handleAssignCoachToClass(cls._id, e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                    >
                      <option value="">Assign Coach</option>
                      {coaches.map((c: any) => (
                        <option key={c._id} value={c._id}>
                          {c.name} ({c.collegeId})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Audit Logs Preview */}
        {activeTab === 'audit' && (
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log._id}
                className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-sky-400 mr-2">[{log.action}]</span>
                  <span className="text-slate-200">{log.details}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Coach Modal */}
      <Modal isOpen={isAddCoachOpen} onClose={() => setIsAddCoachOpen(false)} title="Register New Success Coach">
        <form onSubmit={handleCreateCoach} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
            <input
              type="text"
              required
              value={coachForm.name}
              onChange={(e) => setCoachForm({ ...coachForm, name: e.target.value })}
              placeholder="e.g. Dr. Robert Smith"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
            <input
              type="email"
              required
              value={coachForm.email}
              onChange={(e) => setCoachForm({ ...coachForm, email: e.target.value })}
              placeholder="coach@college.edu"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">College ID</label>
              <input
                type="text"
                required
                value={coachForm.collegeId}
                onChange={(e) => setCoachForm({ ...coachForm, collegeId: e.target.value })}
                placeholder="COA101"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Password</label>
              <input
                type="text"
                required
                value={coachForm.password}
                onChange={(e) => setCoachForm({ ...coachForm, password: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg mt-3"
          >
            Create Success Coach Account
          </button>
        </form>
      </Modal>

      {/* Add Student Modal */}
      <Modal isOpen={isAddStudentOpen} onClose={() => setIsAddStudentOpen(false)} title="Register New Student Profile">
        <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Student Full Name</label>
            <input
              type="text"
              required
              value={studentForm.name}
              onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
              placeholder="e.g. Alex Rivera"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">College Student ID</label>
              <input
                type="text"
                required
                value={studentForm.collegeStudentId}
                onChange={(e) => setStudentForm({ ...studentForm, collegeStudentId: e.target.value })}
                placeholder="STU-2026-005"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Student Email</label>
              <input
                type="email"
                required
                value={studentForm.email}
                onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                placeholder="alex@student.college.edu"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Parent Name</label>
              <input
                type="text"
                required
                value={studentForm.parentName}
                onChange={(e) => setStudentForm({ ...studentForm, parentName: e.target.value })}
                placeholder="Maria Rivera"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Parent Phone</label>
              <input
                type="text"
                required
                value={studentForm.parentPhone}
                onChange={(e) => setStudentForm({ ...studentForm, parentPhone: e.target.value })}
                placeholder="+1 (555) 999-1001"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg mt-3"
          >
            Register Student Profile
          </button>
        </form>
      </Modal>

      {/* Add Class Modal */}
      <Modal isOpen={isAddClassOpen} onClose={() => setIsAddClassOpen(false)} title="Create New Academic Class">
        <form onSubmit={handleCreateClass} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Class Title</label>
            <input
              type="text"
              required
              value={classForm.name}
              onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
              placeholder="e.g. Computer Science 2026 - Section C"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Class Code</label>
            <input
              type="text"
              required
              value={classForm.code}
              onChange={(e) => setClassForm({ ...classForm, code: e.target.value })}
              placeholder="CS-2026-C"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg mt-3"
          >
            Create Class
          </button>
        </form>
      </Modal>
    </div>
  );
};
