import React, { useState, useEffect } from 'react';
import { http } from '../../api/http';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { FiAlertCircle, FiCheckCircle, FiClock, FiLayers, FiDatabase } from 'react-icons/fi';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchStats = () => {
    http.get('/admin/dashboard')
      .then(res => {
        if(res.data.success) setStats(res.data.data);
      })
      .catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
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

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Dashboard...</div>;
  if (!stats) return <div className="p-8 text-center text-slate-500">Failed to load data.</div>;

  const departmentData = Object.entries(stats.departmentBreakdown).map(([name, value]) => ({ name, value }));
  const statusData = Object.entries(stats.statusBreakdown).map(([name, value]) => ({ name, value }));
  const dailyData = stats.dailyTrend?.map(d => ({ name: format(parseISO(d._id), 'MMM d'), count: d.count })) || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff7300', '#ef4444'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
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

      {/* Top Cards */}
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
    </div>
  );
}
