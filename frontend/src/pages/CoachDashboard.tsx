import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { coachApi } from '../services/api';
import { CoachDashboardMetrics, Student } from '../types';
import { StatCard } from '../components/StatCard';
import { OtpModal } from '../components/OtpModal';
import {
  Users,
  MessageSquare,
  Clock,
  Search,
  KeyRound,
  ChevronRight,
  AlertTriangle,
  UserCheck,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

interface CoachDashboardProps {
  showToast: (type: 'success' | 'error', title: string, description?: string) => void;
}

export const CoachDashboard: React.FC<CoachDashboardProps> = ({ showToast }) => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<CoachDashboardMetrics | null>(null);
  const [assignedStudents, setAssignedStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudentForOtp, setSelectedStudentForOtp] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<'assigned' | 'followups' | 'parentVisits'>('assigned');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const resMetrics = await coachApi.getMetrics();
      if (resMetrics.success) setMetrics(resMetrics.metrics);

      const resStudents = await coachApi.getAssignedStudents();
      if (resStudents.success) setAssignedStudents(resStudents.students);
    } catch (err) {
      console.error(err);
      showToast('error', 'Dashboard Error', 'Could not load coach metrics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await coachApi.searchStudent(searchQuery);
      if (res.success) {
        setSearchResults(res.students);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Search Error', 'Failed to search student ID');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header Bar */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Success Coach Workspace</h2>
            <p className="text-xs text-slate-400">
              Track assigned student progress or request Parent Visit Backup OTP access for absent coaches.
            </p>
          </div>

          {/* Instant Student ID Search Form */}
          <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Student ID (e.g. STU-2026-001)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-sky-600/30 transition-all"
            >
              {isSearching ? 'Searching...' : 'Search ID'}
            </button>
          </form>
        </div>

        {/* Search Results Display */}
        {searchResults.length > 0 && (
          <div className="p-4 bg-slate-950/80 border border-sky-500/30 rounded-2xl space-y-3">
            <div className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
              Search Results ({searchResults.length})
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.map((stu) => (
                <div
                  key={stu._id}
                  className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{(stu.user as any)?.name}</span>
                      <span className="text-xs font-mono px-2 py-0.5 bg-slate-800 text-sky-400 rounded-md">
                        {stu.collegeStudentId}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Assigned Coach: {(stu.primaryCoach as any)?.name || 'Dr. Robert Smith'}
                    </div>
                  </div>

                  <div>
                    {stu.isPrimaryCoach || stu.hasTempAccess ? (
                      <button
                        onClick={() => navigate(`/student-profile/${stu._id}`)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-sky-600/20 text-sky-300 hover:bg-sky-600/40 border border-sky-500/40 rounded-lg text-xs font-semibold transition-all"
                      >
                        View Profile <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedStudentForOtp(stu)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 rounded-lg text-xs font-semibold transition-all"
                      >
                        <KeyRound className="w-3 h-3 text-amber-400" /> Request OTP Access
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Students"
          value={metrics?.totalAssignedStudents || 0}
          description="Primary assigned cohort"
          icon={Users}
          color="blue"
          badge="Section A"
        />
        <StatCard
          title="Today's Sessions"
          value={metrics?.todaysInteractions || 0}
          description="Interactions logged today"
          icon={MessageSquare}
          color="emerald"
        />
        <StatCard
          title="Follow-ups Pending"
          value={metrics?.followUpInteractions?.length || 0}
          description="Students requiring follow-up"
          icon={Clock}
          color="amber"
          badge="Action Required"
        />
        <StatCard
          title="Parent Visit Log"
          value={metrics?.parentVisitActivities?.length || 0}
          description="Backup OTP access attempts"
          icon={ShieldCheck}
          color="purple"
        />
      </div>

      {/* Main Roster Section with Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('assigned')}
            className={`pb-3 px-4 transition-all border-b-2 ${
              activeTab === 'assigned'
                ? 'border-sky-500 text-sky-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Assigned Student Roster ({assignedStudents.length})
          </button>
          <button
            onClick={() => setActiveTab('followups')}
            className={`pb-3 px-4 transition-all border-b-2 ${
              activeTab === 'followups'
                ? 'border-sky-500 text-sky-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Follow-Up Checklist ({metrics?.followUpInteractions?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('parentVisits')}
            className={`pb-3 px-4 transition-all border-b-2 ${
              activeTab === 'parentVisits'
                ? 'border-sky-500 text-sky-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Parent Visit / Backup Activity ({metrics?.parentVisitActivities?.length || 0})
          </button>
        </div>

        {/* Tab 1: Assigned Students Table */}
        {activeTab === 'assigned' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 rounded-l-xl">Student Name</th>
                  <th className="p-3.5">College ID</th>
                  <th className="p-3.5">Academic Status</th>
                  <th className="p-3.5">Attendance</th>
                  <th className="p-3.5">Parent Contact</th>
                  <th className="p-3.5 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {assignedStudents.map((stu) => (
                  <tr key={stu._id} className="hover:bg-slate-800/40 transition-all">
                    <td className="p-3.5 font-bold text-white">{(stu.user as any)?.name}</td>
                    <td className="p-3.5 font-mono text-sky-400">{stu.collegeStudentId}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          stu.academicStatus === 'Excellent'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : stu.academicStatus === 'Good'
                            ? 'bg-sky-500/20 text-sky-400'
                            : stu.academicStatus === 'Average'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-red-500/20 text-red-400 animate-pulse'
                        }`}
                      >
                        {stu.academicStatus}
                      </span>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-200">{stu.attendancePercentage}%</td>
                    <td className="p-3.5 text-slate-300">
                      <div>{stu.parentName}</div>
                      <div className="text-[10px] text-slate-500">{stu.parentPhone}</div>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => navigate(`/student-profile/${stu._id}`)}
                        className="px-3 py-1.5 bg-sky-600/20 text-sky-300 hover:bg-sky-600/40 border border-sky-500/30 rounded-lg font-semibold transition-all"
                      >
                        Open Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Followups Checklist */}
        {activeTab === 'followups' && (
          <div className="space-y-3">
            {metrics?.followUpInteractions && metrics.followUpInteractions.length > 0 ? (
              metrics.followUpInteractions.map((item) => (
                <div
                  key={item._id}
                  className="p-4 bg-slate-950 border border-amber-500/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">
                        {((item.student as any)?.user as any)?.name || 'Student'}
                      </span>
                      <span className="text-xs font-mono px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-md">
                        {item.interactionType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{item.topicsDiscussed}</p>
                    <p className="text-[11px] text-slate-400">Coach Remarks: {item.coachRemarks}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {item.followUpDate && (
                      <div className="text-xs text-amber-400 flex items-center gap-1 font-semibold">
                        <Calendar className="w-3.5 h-3.5" />
                        Due: {new Date(item.followUpDate).toLocaleDateString()}
                      </div>
                    )}
                    <button
                      onClick={() => navigate(`/student-profile/${(item.student as any)?._id}`)}
                      className="px-3 py-1.5 bg-sky-600 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-sky-600/30"
                    >
                      View Student
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">No pending follow-up items.</div>
            )}
          </div>
        )}

        {/* Tab 3: Parent Visit Activity */}
        {activeTab === 'parentVisits' && (
          <div className="space-y-3">
            {metrics?.parentVisitActivities && metrics.parentVisitActivities.length > 0 ? (
              metrics.parentVisitActivities.map((act) => (
                <div
                  key={act._id}
                  className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-white">
                      Student: {((act.student as any)?.user as any)?.name || 'Student'} (
                      {(act.student as any)?.collegeStudentId})
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      Requested by Backup Coach: {(act.backupCoach as any)?.name} • Reason: {act.reason}
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        act.isUsed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {act.isUsed ? 'OTP Verified' : 'OTP Generated'}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {new Date(act.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">No recent parent visit activity.</div>
            )}
          </div>
        )}
      </div>

      {/* OTP Request & Verification Modal */}
      {selectedStudentForOtp && (
        <OtpModal
          isOpen={!!selectedStudentForOtp}
          onClose={() => setSelectedStudentForOtp(null)}
          student={selectedStudentForOtp}
          onVerifiedSuccess={() => navigate(`/student-profile/${selectedStudentForOtp._id}`)}
          showToast={showToast}
        />
      )}
    </div>
  );
};
