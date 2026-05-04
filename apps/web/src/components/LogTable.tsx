import React from 'react';
import { RefreshCw } from 'lucide-react';

interface Log {
  id: string;
  otp: { otpCode: string; area: string; number?: string };
  panel: { name: string };
  status: string;
  timestamp: string;
}

interface LogTableProps {
  logs: Log[];
  onViewAll?: () => void;
  onRefresh?: () => void;
}

export const LogTable = ({ logs, onViewAll, onRefresh }: LogTableProps) => {
  return (
    <div className="bg-white rounded-card shadow-soft overflow-hidden border border-white/40">
      <div className="p-8 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-900">Recent Distribution Logs</h3>
        <div className="flex items-center gap-4">
          {onRefresh && (
            <button onClick={onRefresh} className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100">
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          {onViewAll && (
            <button onClick={onViewAll} className="text-blue-500 text-sm font-bold hover:underline">View All</button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-400 text-xs uppercase tracking-widest">
            <tr>
              <th className="px-8 py-5 font-bold">OTP Code</th>
              <th className="px-8 py-5 font-bold">Number</th>
              <th className="px-8 py-5 font-bold">Area</th>
              <th className="px-8 py-5 font-bold">Panel</th>
              <th className="px-8 py-5 font-bold">Status</th>
              <th className="px-8 py-5 font-bold text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-8 py-6">
                  <span className="text-gray-900 font-bold font-mono bg-gray-100 px-3 py-1 rounded-lg text-sm">{log.otp.otpCode}</span>
                </td>
                <td className="px-8 py-6">
                  <span className="text-blue-600 font-bold tracking-wider">{log.otp.number || '---'}</span>
                </td>
                <td className="px-8 py-6 text-gray-600 font-medium">{log.otp.area}</td>
                <td className="px-8 py-6 text-gray-600 font-medium">{log.panel.name}</td>
                <td className="px-8 py-6">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                    log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-600' : 
                    log.status === 'PENDING' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                  }`}>
                    {log.status === 'SUCCESS' ? 'Verified' : 
                     log.status === 'PENDING' ? 'Pending' : 'Failed'}
                  </span>
                </td>
                <td className="px-8 py-6 text-gray-400 text-sm text-right font-medium whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
