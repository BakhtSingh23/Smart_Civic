import React, { useState, useEffect } from 'react';
import { http } from '../../api/http';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { FiFileText, FiDownload, FiChevronLeft, FiChevronRight, FiCalendar, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';

// Priority display mapping
const priorityLabel = (p) => ({ urgent: 'Critical', high: 'High', medium: 'Medium', low: 'Low' }[p] || p);
const priorityBadge = (p) => ({
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-blue-100 text-blue-700',
  low: 'bg-green-100 text-green-700',
}[p] || 'bg-slate-100 text-slate-700');

export default function AutomationReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [page]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await http.get(`/admin/automation-reports?page=${page}&limit=10`);
      if (res.data.success) {
        setReports(res.data.data.reports);
        setTotalPages(res.data.data.totalPages);
      }
    } catch {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const viewReport = async (reportId) => {
    setDetailLoading(true);
    try {
      const res = await http.get(`/admin/automation-reports/${reportId}`);
      if (res.data.success) {
        setSelectedReport(res.data.data);
      }
    } catch {
      toast.error('Failed to load report details');
    } finally {
      setDetailLoading(false);
    }
  };

  const exportPDF = async () => {
    if (!selectedReport) return;

    try {
      // Dynamic import to avoid loading these libraries upfront
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);

      const element = document.getElementById('report-detail-content');
      if (!element) return;

      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`automation-report-${selectedReport.reportId}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch {
      toast.error('Failed to export PDF');
    }
  };

  if (loading && reports.length === 0) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Automation Reports...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FiFileText className="text-emerald-600" /> Automation Reports
        </h1>
      </div>

      {/* Reports List */}
      {!selectedReport && (
        <>
          {reports.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
              <FiFileText size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">No automation reports yet.</p>
              <p className="text-slate-400 text-sm mt-1">Reports are generated when you run "Automate Today's Complaints".</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report._id}
                  onClick={() => viewReport(report._id)}
                  className="bg-white p-5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-bold text-slate-800">{report.reportId}</span>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <FiCalendar size={10} />
                          {format(new Date(report.date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Executed by: {report.executedBy?.name || 'Admin'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1 rounded-lg font-medium">
                        <FiClock size={14} /> {report.totalReceived} received
                      </span>
                      <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg font-medium">
                        <FiCheckCircle size={14} /> {report.totalAssigned} assigned
                      </span>
                      {report.totalFailed > 0 && (
                        <span className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-lg font-medium">
                          <FiXCircle size={14} /> {report.totalFailed} failed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pt-4">
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
        </>
      )}

      {/* Report Detail View */}
      {selectedReport && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <button onClick={() => setSelectedReport(null)} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              <FiChevronLeft size={14} /> Back to Reports
            </button>
            <button onClick={exportPDF} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <FiDownload size={14} /> Export PDF
            </button>
          </div>

          <div id="report-detail-content" className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
              <h2 className="text-xl font-bold">Automation Report: {selectedReport.reportId}</h2>
              <p className="text-emerald-100 text-sm mt-1">
                Date: {format(new Date(selectedReport.date), 'MMMM dd, yyyy')} | 
                Executed by: {selectedReport.executedBy?.name || 'Admin'}
              </p>
            </div>

            <div className="p-6 space-y-8">
              {/* Overall Stats */}
              <div>
                <h3 className="font-semibold text-slate-800 mb-3">Overall Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { label: 'Total Received', value: selectedReport.totalReceived, color: 'blue' },
                    { label: 'Processed', value: selectedReport.totalProcessed, color: 'indigo' },
                    { label: 'Assigned', value: selectedReport.totalAssigned, color: 'emerald' },
                    { label: 'Failed', value: selectedReport.totalFailed, color: 'red' },
                    { label: 'Pending', value: selectedReport.totalPending, color: 'amber' },
                    { label: 'Duplicates', value: selectedReport.totalDuplicates, color: 'purple' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className={`text-center p-3 bg-${color}-50 rounded-xl border border-${color}-100`}>
                      <div className={`text-xl font-bold text-${color}-700`}>{value}</div>
                      <div className={`text-xs text-${color}-600`}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Department Summary */}
              {selectedReport.departmentSummary && (
                <div>
                  <h3 className="font-semibold text-slate-800 mb-3">Department Statistics</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b-2 border-slate-200">
                          <th className="pb-3 font-semibold text-slate-600">Department</th>
                          <th className="pb-3 font-semibold text-slate-600 text-center">Assigned</th>
                          <th className="pb-3 font-semibold text-slate-600 text-center">Pending</th>
                          <th className="pb-3 font-semibold text-slate-600 text-center">Failed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...selectedReport.departmentSummary.entries?.() || Object.entries(selectedReport.departmentSummary)].map(([dept, data]) => {
                          const d = data.toJSON ? data.toJSON() : data;
                          return (
                            <tr key={dept} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-3 font-medium text-slate-800">{dept}</td>
                              <td className="py-3 text-center"><span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-semibold">{d.assigned || 0}</span></td>
                              <td className="py-3 text-center"><span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-semibold">{d.pending || 0}</span></td>
                              <td className="py-3 text-center"><span className="bg-red-100 text-red-700 px-2 py-0.5 rounded font-semibold">{d.failed || 0}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Priority Summary */}
              {selectedReport.prioritySummary && (
                <div>
                  <h3 className="font-semibold text-slate-800 mb-3">Priority Distribution</h3>
                  <div className="flex flex-wrap gap-3">
                    {[...selectedReport.prioritySummary.entries?.() || Object.entries(selectedReport.prioritySummary)].map(([p, count]) => (
                      <div key={p} className={`px-4 py-2 rounded-xl font-semibold ${priorityBadge(p)}`}>
                        {priorityLabel(p)}: {count}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Authority Assignments */}
              {selectedReport.authorityAssignments?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-800 mb-3">Authority Assignments</h3>
                  <div className="space-y-2">
                    {selectedReport.authorityAssignments.map((a, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <div>
                          <div className="font-medium text-slate-800 text-sm">{a.officerName}</div>
                          <div className="text-xs text-slate-500">{a.department}</div>
                        </div>
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                          {a.assignedCount} complaints
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution Summary */}
              {selectedReport.resolutionSummary && (
                <div>
                  <h3 className="font-semibold text-slate-800 mb-3">Resolution Snapshot</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-emerald-50 rounded-xl">
                      <div className="text-xl font-bold text-emerald-700">{selectedReport.resolutionSummary.resolved}</div>
                      <div className="text-xs text-emerald-600">Resolved</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                      <div className="text-xl font-bold text-blue-700">{selectedReport.resolutionSummary.inProgress}</div>
                      <div className="text-xs text-blue-600">In Progress</div>
                    </div>
                    <div className="text-center p-4 bg-amber-50 rounded-xl">
                      <div className="text-xl font-bold text-amber-700">{selectedReport.resolutionSummary.pending}</div>
                      <div className="text-xs text-amber-600">Pending</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Errors */}
              {selectedReport.errors?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-red-700 mb-3">Errors ({selectedReport.errors.length})</h3>
                  <div className="space-y-2">
                    {selectedReport.errors.map((e, idx) => (
                      <div key={idx} className="text-sm text-red-700 bg-red-50 p-3 rounded-lg border border-red-100">
                        <span className="font-semibold">{e.complaintId}:</span> {e.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
