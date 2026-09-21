import React, { useState } from 'react';
import { Modal } from './Modal';
import { Student } from '../types';
import { otpApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { KeyRound, ShieldAlert, Check, Copy, Clock, AlertCircle, ArrowRight } from 'lucide-react';

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onVerifiedSuccess: () => void;
  showToast: (type: 'success' | 'error', title: string, description?: string) => void;
}

export const OtpModal: React.FC<OtpModalProps> = ({
  isOpen,
  onClose,
  student,
  onVerifiedSuccess,
  showToast,
}) => {
  const { setTempAccess } = useAuth();
  const [activeTab, setActiveTab] = useState<'request' | 'verify'>('request');
  const [reason, setReason] = useState('Parent Visit - Assigned Coach Absent');
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await otpApi.requestOtp(student._id, reason);
      if (res.success && res.plainOtp) {
        setGeneratedOtp(res.plainOtp);
        setOtpInput(res.plainOtp); // Pre-fill input for smooth testing demo!
        showToast('success', 'OTP Generated', 'Single-use 10-minute OTP created by assigned coach');
      } else {
        setErrorMsg(res.message || 'Failed to generate OTP');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error requesting OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput.trim()) {
      setErrorMsg('Please enter the 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await otpApi.verifyOtp(student._id, otpInput.trim());
      if (res.success && res.tempToken) {
        setTempAccess(res.tempToken, student._id);
        showToast('success', 'Access Granted', 'Temporary 30-minute read-only access activated');
        onVerifiedSuccess();
        onClose();
      } else {
        setErrorMsg(res.message || 'Verification failed');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Invalid or Expired OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Parent Visit Backup Access: ${student.collegeStudentId}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Workflow Info Banner */}
        <div className="p-3 bg-sky-950/50 border border-sky-500/30 rounded-xl text-xs text-sky-200 flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sky-300">Security Verification Protocol</div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Assigned Coach: <strong className="text-white">{(student.primaryCoach as any)?.name || 'Dr. Robert Smith'}</strong>. Single-use OTPs expire automatically after 10 minutes and grant 30-minute read-only access.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 text-xs font-semibold">
          <button
            onClick={() => {
              setActiveTab('request');
              setErrorMsg('');
            }}
            className={`pb-2.5 px-4 transition-all border-b-2 ${
              activeTab === 'request'
                ? 'border-sky-500 text-sky-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Request OTP Code
          </button>
          <button
            onClick={() => {
              setActiveTab('verify');
              setErrorMsg('');
            }}
            className={`pb-2.5 px-4 transition-all border-b-2 ${
              activeTab === 'verify'
                ? 'border-sky-500 text-sky-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Enter & Verify OTP
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Request OTP Tab */}
        {activeTab === 'request' && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Visit Reason / Notes</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Parent visit reason..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            {generatedOtp && (
              <div className="p-4 bg-slate-950 border border-emerald-500/40 rounded-2xl text-center space-y-2">
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Secure Single-Use OTP
                </div>
                <div className="text-3xl font-mono font-bold tracking-widest text-emerald-400 flex items-center justify-center gap-3">
                  {generatedOtp}
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedOtp)}
                    className="p-1.5 text-xs bg-slate-900 border border-slate-700 hover:bg-slate-800 rounded-lg text-slate-200 transition-all"
                    title="Copy OTP"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-[11px] text-amber-400 flex items-center justify-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Valid for 10 minutes • Single-Use Only
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-sky-600/30 disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" /> {isLoading ? 'Generating...' : 'Generate Secure OTP'}
              </button>

              {generatedOtp && (
                <button
                  type="button"
                  onClick={() => setActiveTab('verify')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:underline"
                >
                  Proceed to Verify <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        )}

        {/* Verify OTP Tab */}
        {activeTab === 'verify' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target College Student ID</label>
              <input
                type="text"
                disabled
                value={student.collegeStudentId}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-400 cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Enter 6-Digit OTP Code</label>
              <input
                type="text"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 849201"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-2xl font-mono tracking-widest text-center text-white focus:outline-none focus:border-sky-500"
              />
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
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" /> {isLoading ? 'Verifying...' : 'Verify OTP & Unlock Access'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
