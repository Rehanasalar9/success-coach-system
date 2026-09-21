import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogIn, Key, UserCheck, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, quickSwitchRole } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setErrorMsg('Please enter email or College ID and password');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    const success = await login(identifier, password);
    if (!success) {
      setErrorMsg('Invalid login credentials. Check email/College ID and password.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/40 z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-sky-500/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Success Coach Portal
          </h2>
          <p className="text-xs text-slate-400">College Student Progress & Parent Visit System</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email or College ID</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. coach.smith@college.edu or STU-2026-001"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" /> {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Demo Login Buttons Box */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <div className="text-center text-xs font-semibold text-slate-400">Quick One-Click Demo Logins</div>
          <div className="grid grid-cols-2 gap-2 text-xs font-medium">
            <button
              onClick={() => quickSwitchRole('admin')}
              className="p-2.5 bg-purple-950/40 border border-purple-500/30 hover:border-purple-500/60 text-purple-300 rounded-xl text-left transition-all"
            >
              <div className="font-bold text-white">Admin Account</div>
              <div className="text-[10px] text-purple-400">Full System Control</div>
            </button>
            <button
              onClick={() => quickSwitchRole('smith')}
              className="p-2.5 bg-sky-950/40 border border-sky-500/30 hover:border-sky-500/60 text-sky-300 rounded-xl text-left transition-all"
            >
              <div className="font-bold text-white">Coach Smith</div>
              <div className="text-[10px] text-sky-400">Primary Coach Sec A</div>
            </button>
            <button
              onClick={() => quickSwitchRole('davis')}
              className="p-2.5 bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-500/60 text-cyan-300 rounded-xl text-left transition-all"
            >
              <div className="font-bold text-white">Coach Davis</div>
              <div className="text-[10px] text-cyan-400">Backup Coach Sec B</div>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};
