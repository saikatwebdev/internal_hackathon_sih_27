import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { ShieldAlert } from 'lucide-react';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuditLogs = async () => {
      try {
        const res = await axiosClient.get('/audit-logs');
        setLogs(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadAuditLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white tracking-tight flex items-center">
          <ShieldAlert className="w-5 h-5 text-amber-400 mr-2" /> System Audit Logs
        </h3>
        <p className="text-xs text-slate-400">Immutable record of administrative operations and attendance corrections</p>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Entity Type</th>
                <th className="px-6 py-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-800/40">
                  <td className="px-6 py-4 text-slate-400 font-sans">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4 font-bold text-amber-400">{l.action}</td>
                  <td className="px-6 py-4 text-slate-300 uppercase">{l.role}</td>
                  <td className="px-6 py-4 text-blue-400">{l.entity_type}</td>
                  <td className="px-6 py-4 text-[11px] text-slate-300">
                    {l.new_data ? JSON.stringify(l.new_data) : '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
