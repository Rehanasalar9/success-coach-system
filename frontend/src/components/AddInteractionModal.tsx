import React, { useState } from 'react';
import { Modal } from './Modal';
import { InteractionType, Student } from '../types';
import { interactionApi } from '../services/api';
import { Calendar, Save, AlertCircle } from 'lucide-react';

interface AddInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onSuccess: () => void;
  showToast: (type: 'success' | 'error', title: string, description?: string) => void;
}

export const AddInteractionModal: React.FC<AddInteractionModalProps> = ({
  isOpen,
  onClose,
  student,
  onSuccess,
  showToast,
}) => {
  const [interactionType, setInteractionType] = useState<InteractionType>('Academic');
  const [academicProgress, setAcademicProgress] = useState('');
  const [behaviourNotes, setBehaviourNotes] = useState('');
  const [attendanceNotes, setAttendanceNotes] = useState('');
  const [topicsDiscussed, setTopicsDiscussed] = useState('');
  const [coachRemarks, setCoachRemarks] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (
      !academicProgress.trim() ||
      !behaviourNotes.trim() ||
      !attendanceNotes.trim() ||
      !topicsDiscussed.trim() ||
      !coachRemarks.trim()
    ) {
      setErrorMsg('Please fill out all required interaction fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await interactionApi.addInteraction({
        studentId: student._id,
        interactionType,
        academicProgress,
        behaviourNotes,
        attendanceNotes,
        topicsDiscussed,
        coachRemarks,
        followUpRequired,
        followUpDate: followUpRequired && followUpDate ? followUpDate : undefined,
      });

      if (res.success) {
        showToast('success', 'Interaction Recorded', `Session log added for student ${student.collegeStudentId}`);
        onSuccess();
        onClose();
        // Reset form
        setAcademicProgress('');
        setBehaviourNotes('');
        setAttendanceNotes('');
        setTopicsDiscussed('');
        setCoachRemarks('');
        setFollowUpRequired(false);
        setFollowUpDate('');
      } else {
        setErrorMsg(res.message || 'Failed to record interaction');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Error submitting interaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Record Session: ${student.collegeStudentId}`} maxWidth="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Interaction Type</label>
            <select
              value={interactionType}
              onChange={(e) => setInteractionType(e.target.value as InteractionType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            >
              <option value="Academic">Academic Development</option>
              <option value="Behavioural">Behaviour & Conduct</option>
              <option value="Attendance">Attendance Observation</option>
              <option value="Career">Career Guidance</option>
              <option value="Personal">Personal Counseling</option>
              <option value="Parent Meeting">Parent Meeting</option>
              <option value="General">General Follow-Up</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Student College ID</label>
            <input
              type="text"
              disabled
              value={`${student.collegeStudentId}`}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Progress & Grades</label>
          <textarea
            rows={2}
            value={academicProgress}
            onChange={(e) => setAcademicProgress(e.target.value)}
            placeholder="e.g. GPA status, mid-term exam performance, lab assignment submission..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Behavioural Observations</label>
            <textarea
              rows={2}
              value={behaviourNotes}
              onChange={(e) => setBehaviourNotes(e.target.value)}
              placeholder="Classroom participation, attitude, group work..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Attendance & Participation</label>
            <textarea
              rows={2}
              value={attendanceNotes}
              onChange={(e) => setAttendanceNotes(e.target.value)}
              placeholder="Lecture attendance percentage, punctuality observations..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Topics Discussed</label>
          <input
            type="text"
            value={topicsDiscussed}
            onChange={(e) => setTopicsDiscussed(e.target.value)}
            placeholder="e.g. Exam prep strategies, attendance recovery plan..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Success Coach Remarks & Action Plan</label>
          <textarea
            rows={2}
            value={coachRemarks}
            onChange={(e) => setCoachRemarks(e.target.value)}
            placeholder="Coach recommendation, action steps, advice given to student..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-200">
            <input
              type="checkbox"
              checked={followUpRequired}
              onChange={(e) => setFollowUpRequired(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded border-slate-800 focus:ring-sky-500"
            />
            Requires Follow-Up Meeting
          </label>

          {followUpRequired && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-400" />
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-sky-600/30 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {isSubmitting ? 'Saving...' : 'Save Interaction'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
