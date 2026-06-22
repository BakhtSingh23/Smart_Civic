import React, { useState, useEffect } from 'react';
import { http } from '../../api/http';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { FiActivity, FiChevronLeft, FiChevronRight, FiClock, FiCheckCircle, FiXCircle, FiAlertTriangle } from 'react-icons/fi';

export default function AutomationLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedLog, setExpandedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await http.get(`/admin/automation-logs?page=${page}&limit=15`);
      if (res.data.success) {
        setLogs(res.data.data.logs);
        setTotalPages(res.data.data.totalPages);
      }
    } catch {
      toast.error('Failed to load automation logs');
    } finally {
      setLoading(false);
    }
  };

  if (loading && logs.length === 0) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Automation Logs...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <FiActivity className="text-indigo-600" /> Automation Logs
      </h1>
      <p className="text-sm text-slate-500">Audit trail of all automation engine executions. Click a row to view error details.</p>

      {logs.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
          <FiActivity size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">No automation logs yet.</p>
          <p className="text-slate-400 text-sm mt-1">Logs are created when you run "Automate Today's Complaints".</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left p-4 font-semibold text-slate-600">Date & Time</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Admin</th>
                  <th className="text-center p-4 font-semibold text-slate-600">Processed</th>
                  <th className="text-center p-4 font-semibold text-slate-600">Assigned</th>
                  <th className="text-center p-4 font-semibold text-slate-600">Failed</th>
                  <th className="text-center p-4 font-semibold text-slate-600">Duplicates</th>
                  <th className="text-center p-4 font-semibold text-slate-600">Duration</th>
                  <th className="text-center p-4 font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const hasErrors = log.errors?.length > 0;
                  const isExpanded = expandedLog === log._id;
                  const successRate = log.totalProcessed > 0
                    ? Math.round((log.totalAssigned / log.totalProcessed) * 100)
                    : 0;

                  return (
                    <React.Fragment key={log._id}>
                      <tr
                        onClick={() => setExpandedLog(isExpanded ? null : log._id)}
                        className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${isExpanded ? 'bg-slate-50' : ''}`}
                      >
                        <td className="p-4">
                          <div className="font-medium text-slate-800">
                            {format(new Date(log.executionTime), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-xs text-slate-500">
                            {format(new Date(log.executionTime), 'hh:mm:ss a')}
                          </div>
                        </td>
                        <td className="p-4 text-slate-700">{log.executedBy?.name || 'Admin'}</td>
                        <td className="p-4 text-center">
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">
                            {log.totalProcessed}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold">
                            {log.totalAssigned}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded font-semibold ${log.totalFailed > 0 ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-500'}`}>
                            {log.totalFailed}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-semibold">
                            {log.totalDuplicates}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="flex items-center justify-center gap-1 text-slate-600">
                            <FiClock size={12} />
                            {log.duration ? `${(log.duration / 1000).toFixed(1)}s` : 'N/A'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {log.totalFailed === 0 ? (
                            <span className="flex items-center justify-center gap-1 text-emerald-600">
                              <FiCheckCircle size={14} /> Success
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-1 text-amber-600">
                              <FiAlertTriangle size={14} /> Partial
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Error Details */}
                      {isExpanded && hasErrors && (
                        <tr>
                          <td colSpan={8} className="bg-red-50 px-6 py-4 border-b border-red-100">
                            <div className="flex items-center gap-2 mb-2">
                              <FiXCircle className="text-red-600" />
                              <span className="font-semibold text-red-700 text-sm">Error Details ({log.errors.length})</span>
                            </div>
                            <div className="space-y-1.5">
                              {log.errors.map((err, idx) => (
                                <div key={idx} className="text-sm text-red-700 bg-white p-2 rounded border border-red-100">
                                  <span className="font-medium">{err.complaintId}:</span> {err.error}
                                  {err.timestamp && (
                                    <span className="text-xs text-red-400 ml-2">
                                      ({format(new Date(err.timestamp), 'hh:mm:ss a')})
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}

                      {isExpanded && !hasErrors && (
                        <tr>
                          <td colSpan={8} className="bg-emerald-50 px-6 py-3 border-b border-emerald-100 text-center text-sm text-emerald-700">
                            ✅ No errors — all complaints processed successfully ({successRate}% success rate)
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-colors"
          >
            <FiChevronLeft />
          </button>
          <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-colors"
          >
            <FiChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}
