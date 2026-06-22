import React, { useState, useEffect } from 'react';
import { http } from '../../api/http';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { FiAlertCircle, FiCheckCircle, FiClock, FiLayers, FiDatabase, FiZap, FiUsers, FiTrendingUp } from 'react-icons/fi';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAutomating, setIsAutomating] = useState(false);
  const [automationResult, setAutomationResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [workloadData, setWorkloadData] = useState(null);

  const fetchStats = () => {
    http.get('/admin/dashboard')
      .then(res => {
        if(res.data.success) setStats(res.data.data);
      })
      .catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  };

  const fetchWorkload = () => {
    http.get('/admin/workload-summary')
      .then(res => {
        if(res.data.success) setWorkloadData(res.data.data);
      })
      .catch(() => {}); // Non-critical, silent fail
  };

  useEffect(() => {
    fetchStats();
    fetchWorkload();
  }, []);

  const handleGenerateData = async () => {
    if (!window.confirm("Are you sure you want to generate dummy complaints? This action cannot be undone.")) return;
    setIsGenerating(true);
    const toastId = toast.loading("Generating training data...");
    try {
      const res = await http.post('/admin/generate-training-data');
      if (res.data.success) {
        toast.update(toastId, { render: res.data.message, type: "success", isLoading: false, autoClose: 3000 });
        fetchStats(); // Refresh the stats
      } else {
        toast.update(toastId, { render: res.data.message || 'Generation failed', type: "error", isLoading: false, autoClose: 3000 });
      }
    } catch (error) {
      toast.update(toastId, { render: error.response?.data?.message || 'Generation failed', type: "error", isLoading: false, autoClose: 3000 });
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Automate Today's Complaints ───────────────────────────────────────────
  const handleAutomateComplaints = async () => {
    if (!window.confirm(
      "🤖 Automate Today's Complaints?\n\n" +
      "This will automatically:\n" +
      "• Route verified complaints to departments\n" +
      "• Assign them to least-loaded officers\n" +
      "• Send notifications to assigned officers\n" +
      "• Generate an end-of-day report\n\n" +
      "Only verified, unassigned complaints from today will be processed.\n\n" +
      "Continue?"
    )) return;

    setIsAutomating(true);
    setAutomationResult(null);
    const toastId = toast.loading("🤖 Processing today's complaints...");

    try {
      const res = await http.post('/admin/automate-complaints');
      if (res.data.success) {
        const data = res.data.data;
        setAutomationResult(data);
        setShowResultModal(true);
        toast.update(toastId, {
          render: `✅ ${data.totalAssigned} complaints assigned out of ${data.totalReceived} eligible`,
          type: "success",
          isLoading: false,
          autoClose: 5000,
        });
        fetchStats();
        fetchWorkload();
      } else {
        toast.update(toastId, { render: res.data.message || 'Automation failed', type: "error", isLoading: false, autoClose: 3000 });
      }
    } catch (error) {
      toast.update(toastId, { render: error.response?.data?.message || 'Automation failed', type: "error", isLoading: false, autoClose: 3000 });
    } finally {
      setIsAutomating(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Dashboard...</div>;
  if (!stats) return <div className="p-8 text-center text-slate-500">Failed to load data.</div>;

  const departmentData = Object.entries(stats.departmentBreakdown).map(([name, value]) => ({ name, value }));
  const statusData = Object.entries(stats.statusBreakdown).map(([name, value]) => ({ name, value }));
  const dailyData = stats.dailyTrend?.map(d => ({ name: format(parseISO(d._id), 'MMM d'), count: d.count })) || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff7300', '#ef4444'];

  // Priority display mapping (urgent → Critical in UI)
  const priorityLabel = (p) => {
    const map = { urgent: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };
    return map[p] || p;
  };
  const priorityColor = (p) => {
    const map = { urgent: 'text-red-600 bg-red-50', high: 'text-orange-600 bg-orange-50', medium: 'text-blue-600 bg-blue-50', low: 'text-green-600 bg-green-50' };
    return map[p] || 'text-slate-600 bg-slate-50';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header with Action Buttons */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
        <div className="flex flex-wrap gap-3">
          {/* Automate Today's Complaints Button */}
          <button 
            onClick={handleAutomateComplaints}
            disabled={isAutomating}
            id="automate-complaints-btn"
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isAutomating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              <>
                <FiZap className="text-lg" />
                Automate Today's Complaints
              </>
            )}
          </button>

          <button 
            onClick={handleGenerateData}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:bg-indigo-400"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating...
              </>
            ) : (
              <>
                <FiDatabase />
                Generate Training Data
              </>
            )}
          </button>
        </div>
      </div>

      {/* Automation Stats Cards (new row) */}
      {workloadData && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200">
            <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">Today's Complaints</div>
            <div className="text-2xl font-bold text-emerald-800">{workloadData.todaysComplaints}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
            <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Auto Assigned Today</div>
            <div className="text-2xl font-bold text-blue-800">{workloadData.autoAssignedToday}</div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-4 rounded-xl border border-amber-200">
            <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Pending Assignment</div>
            <div className="text-2xl font-bold text-amber-800">{workloadData.pendingAssignment}</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-rose-50 p-4 rounded-xl border border-red-200">
            <div className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">Critical Complaints</div>
            <div className="text-2xl font-bold text-red-800">{workloadData.criticalComplaints}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-200">
            <div className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">Available Officers</div>
            <div className="text-2xl font-bold text-purple-800">{workloadData.availableAuthorities}</div>
          </div>
        </div>
      )}

      {/* Original Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><FiLayers size={24} /></div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{stats.totalComplaints}</div>
            <div className="text-sm text-slate-500">Total Complaints</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-lg"><FiClock size={24} /></div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{stats.pendingVerification}</div>
            <div className="text-sm text-slate-500">Pending Verification</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-lg"><FiAlertCircle size={24} /></div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{stats.activeIncidents}</div>
            <div className="text-sm text-slate-500">Active Incidents</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg"><FiCheckCircle size={24} /></div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{stats.resolvedThisMonth}</div>
            <div className="text-sm text-slate-500">Resolved This Month</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-4">Complaints by Department</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-4">Complaint Trends (Last 30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-4">Status Distribution</h3>
          <div className="h-64 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {statusData.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-600 capitalize">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                {entry.name} ({entry.value})
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-800">Oldest Pending Complaints</h3>
              <Link to="/admin/complaints/pending" className="text-sm text-blue-600 hover:underline">View All</Link>
            </div>
            <div className="space-y-3">
              {stats.oldestPending?.length === 0 ? <p className="text-sm text-slate-500">No pending complaints.</p> : stats.oldestPending?.map(c => (
                <Link to={`/admin/complaints/${c._id}`} key={c._id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg border border-slate-100 transition-colors">
                  <div>
                    <div className="font-medium text-slate-800 text-sm">{c.complaintId}</div>
                    <div className="text-xs text-slate-500">{c.title}</div>
                  </div>
                  <div className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    {formatDistanceToNow(new Date(c.createdAt))} ago
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {stats.urgentUnresolved?.length > 0 && (
            <div className="bg-rose-50 p-6 rounded-xl border border-rose-200">
              <h3 className="font-semibold text-rose-800 mb-4 flex items-center gap-2"><FiAlertCircle /> Urgent Unresolved</h3>
              <div className="space-y-3">
                {stats.urgentUnresolved.map(c => (
                  <Link to={`/admin/complaints/${c._id}`} key={c._id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-rose-100 hover:shadow-sm transition-all">
                    <div>
                      <div className="font-medium text-slate-800 text-sm">{c.complaintId} <span className="uppercase text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded ml-2">{c.status}</span></div>
                      <div className="text-xs text-slate-500">{c.title}</div>
                    </div>
                    <div className="text-xs font-medium text-rose-600">
                      {formatDistanceToNow(new Date(c.createdAt))} ago
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ─── Automation Result Modal ─────────────────────────────────────────── */}
      {showResultModal && automationResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowResultModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FiZap /> Automation Complete
              </h2>
              <p className="text-emerald-100 text-sm mt-1">
                Processed in {automationResult.duration ? `${(automationResult.duration / 1000).toFixed(1)}s` : 'N/A'}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-700">{automationResult.totalReceived}</div>
                  <div className="text-xs text-blue-600">Eligible</div>
                </div>
                <div className="text-center p-3 bg-emerald-50 rounded-xl">
                  <div className="text-2xl font-bold text-emerald-700">{automationResult.totalAssigned}</div>
                  <div className="text-xs text-emerald-600">Assigned</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-xl">
                  <div className="text-2xl font-bold text-red-700">{automationResult.totalFailed}</div>
                  <div className="text-xs text-red-600">Failed</div>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-xl">
                  <div className="text-2xl font-bold text-amber-700">{automationResult.totalDuplicates}</div>
                  <div className="text-xs text-amber-600">Duplicates</div>
                </div>
              </div>

              {/* Priority Summary */}
              {automationResult.prioritySummary && (
                <div>
                  <h4 className="font-semibold text-slate-700 mb-2">Priority Distribution</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(automationResult.prioritySummary).map(([p, count]) => (
                      <span key={p} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${priorityColor(p)}`}>
                        {priorityLabel(p)}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Department Summary */}
              {automationResult.departmentSummary && Object.keys(automationResult.departmentSummary).length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-700 mb-2">Department Breakdown</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-500 border-b">
                          <th className="pb-2">Department</th>
                          <th className="pb-2 text-center">Assigned</th>
                          <th className="pb-2 text-center">Failed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(automationResult.departmentSummary).map(([dept, data]) => (
                          <tr key={dept} className="border-b border-slate-100">
                            <td className="py-2 font-medium text-slate-700">{dept}</td>
                            <td className="py-2 text-center text-emerald-600 font-semibold">{data.assigned || 0}</td>
                            <td className="py-2 text-center text-red-600 font-semibold">{data.failed || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Authority Assignments */}
              {automationResult.authorityAssignments?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-700 mb-2">Officer Assignments</h4>
                  <div className="space-y-2">
                    {automationResult.authorityAssignments.map((a, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <div>
                          <div className="font-medium text-slate-800 text-sm">{a.officerName}</div>
                          <div className="text-xs text-slate-500">{a.department}</div>
                        </div>
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                          {a.count} assigned
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {automationResult.errors?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-700 mb-2">Errors</h4>
                  <div className="space-y-1">
                    {automationResult.errors.map((e, idx) => (
                      <div key={idx} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        <span className="font-medium">{e.complaintId}:</span> {e.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* View Report Link */}
              {automationResult.reportId && (
                <div className="text-center pt-2">
                  <Link to="/admin/automation-reports" className="text-blue-600 hover:underline text-sm font-medium">
                    View Full Report →
                  </Link>
                </div>
              )}
            </div>

            <div className="p-4 border-t flex justify-end">
              <button 
                onClick={() => setShowResultModal(false)}
                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
