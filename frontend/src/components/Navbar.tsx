import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut, UserCheck, Key, RefreshCw } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, quickSwitchRole, tempToken, tempStudentId, clearTempAccess, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Brand & Demo Notice */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Success Coach Portal
            </h1>
            <p className="text-xs text-slate-400">College Student Progress & Parent Visit System</p>
          </div>
        </div>

        {/* Quick Role Switcher Bar (Demo Bar) */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 text-xs overflow-x-auto">
          <span className="text-slate-400 px-2 font-medium flex items-center gap-1">
            <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isLoading ? 'animate-spin' : ''}`} /> Demo Logins:
          </span>
          <button
            onClick={() => quickSwitchRole('admin')}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium ${user?.role === 'admin'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-300 hover:bg-slate-800'
              }`}
          >
            Admin
          </button>
          <button
            onClick={() => quickSwitchRole('smith')}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium ${user?.email === 'coach.smith@college.edu'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-300 hover:bg-slate-800'
              }`}
          >
            Coach Smith (Sec A)
          </button>
          <button
            onClick={() => quickSwitchRole('davis')}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium ${user?.email === 'coach.davis@college.edu'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-300 hover:bg-slate-800'
              }`}
          >
            Coach Davis (Backup)
          </button>

        </div>

        {/* Active Temp Access Alert & User Details */}
        <div className="flex items-center gap-3">
          {tempToken && (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl text-amber-400 text-xs animate-pulse">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Temp Read-Only Access Active</span>
              <button
                onClick={clearTempAccess}
                className="ml-1 bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 rounded text-amber-300 transition-all font-medium"
              >
                Exit
              </button>
            </div>
          )}

          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-slate-200">{user.name}</div>
                <div className="text-xs text-sky-400 uppercase font-mono tracking-wider">
                  {user.role} • {user.collegeId}
                </div>
              </div>
              <button
                onClick={logout}
                title="Log Out"
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-xl transition-all"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
