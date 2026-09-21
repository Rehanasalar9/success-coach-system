import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  BookOpen,
  History,
  FileText,
  KeyRound,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-65px)]">
      <div className="p-4 space-y-6">
        {/* Navigation Sections */}
        <div>
          <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Main Menu
          </div>
          <nav className="space-y-1">
            {role === 'admin' && (
              <>
                <NavLink
                  to="/admin"
                  end
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-sky-600/20 text-sky-400 border border-sky-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`
                  }
                >
                  <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
                </NavLink>
                <NavLink
                  to="/admin/classes"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-sky-600/20 text-sky-400 border border-sky-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`
                  }
                >
                  <BookOpen className="w-4 h-4" /> Manage Classes
                </NavLink>
                <NavLink
                  to="/admin/audit-logs"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-sky-600/20 text-sky-400 border border-sky-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`
                  }
                >
                  <History className="w-4 h-4" /> System Audit Logs
                </NavLink>
              </>
            )}

            {role === 'coach' && (
              <>
                <NavLink
                  to="/coach"
                  end
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-sky-600/20 text-sky-400 border border-sky-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`
                  }
                >
                  <LayoutDashboard className="w-4 h-4" /> Coach Dashboard
                </NavLink>
              </>
            )}


          </nav>
        </div>

        {/* Workflow Info Box */}
        <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold text-sky-400">
            <KeyRound className="w-4 h-4" /> Parent Visit Workflow
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Backup coaches can search any student ID and input a single-use 10-minute OTP from the assigned coach for 30-min read-only access.
          </p>
        </div>
      </div>
    </aside>
  );
};
