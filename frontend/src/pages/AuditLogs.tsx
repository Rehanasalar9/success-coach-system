import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { AuditLog } from '../types';
import { History, Search, ShieldCheck, AlertTriangle, Key } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getAuditLogs();
      if (res.success) setLogs(res.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.actor as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" /> System Security & Access Audit Logs
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            End-to-end audit trail recording user logins, OTP generation, parent visit backup accesses, and interaction updates.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter audit events..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5 rounded-l-xl">Timestamp</th>
                <th className="p-3.5">Action Event</th>
                <th className="p-3.5">Actor User</th>
                <th className="p-3.5">Details</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right rounded-r-xl">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-800/40 transition-all">
                  <td className="p-3.5 font-mono text-slate-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3.5 font-bold font-mono">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[11px] ${
                        log.action.includes('OTP_VERIFY_SUCCESS') || log.action.includes('LOGIN_SUCCESS')
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : log.action.includes('FAILED') || log.action.includes('UNAUTHORIZED')
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3.5 font-semibold text-slate-200">
                    {(log.actor as any)?.name || 'System Auto'}
                    <div className="text-[10px] text-slate-500">{log.actorRole?.toUpperCase()}</div>
                  </td>
                  <td className="p-3.5 text-slate-300 max-w-md">{log.details}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : log.status === 'FAILED'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-500">{log.ipAddress || '127.0.0.1'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
