import React, { useState, useEffect } from 'react';
import { http } from '../../api/http';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { FiUsers, FiRefreshCw, FiCheckCircle, FiXCircle, FiClock, FiAlertCircle } from 'react-icons/fi';

const STATUS_LABELS = {
  active: { label: 'Active', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  busy: { label: 'Busy', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  on_leave: { label: 'On Leave', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  inactive: { label: 'Inactive', color: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
};

export default function WorkloadDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null); // officerId being updated

  useEffect(() => {
    fetchWorkload();
  }, []);

  const fetchWorkload = async () => {
    setLoading(true);
    try {
      const res = await http.get('/admin/workload-summary');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch {
      toast.error('Failed to load workload data');
    } finally {
      setLoading(false);
    }
  };

  const updateAvailability = async (officerId, newStatus) => {
    setUpdating(officerId);
    try {
      const res = await http.patch(`/admin/officers/${officerId}/availability`, {
        availabilityStatus: newStatus,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchWorkload(); // Refresh
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update availability');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Workload Data...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-slate-500">Failed to load workload data.</div>;
  }

  // Build chart data from departments
  const departmentChartData = Object.entries(data.departments || {}).map(([dept, info]) => ({
    name: dept.length > 12 ? dept.substring(0, 12) + '…' : dept,
    fullName: dept,
    totalOfficers: info.totalOfficers,
    available: info.availableOfficers,
    totalWorkload: info.officers.reduce((sum, o) => sum + o.workload, 0),
  }));

  // Build officer workload chart data (top 15 by workload)
  const allOfficers = Object.values(data.departments || {}).flatMap(d => d.officers);
  const officerChartData = [...allOfficers]
    .sort((a, b) => b.workload - a.workload)
    .slice(0, 15)
    .map(o => ({
      name: o.name.length > 15 ? o.name.substring(0, 15) + '…' : o.name,
      workload: o.workload,
    }));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FiUsers className="text-indigo-600" /> Workload Dashboard
        </h1>
        <button
          onClick={fetchWorkload}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors"
        >
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><FiClock size={18} /></div>
            <span className="text-sm font-semibold text-slate-600">Today's Complaints</span>
          </div>
          <div className="text-2xl font-bold text-slate-800">{data.todaysComplaints}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><FiCheckCircle size={18} /></div>
            <span className="text-sm font-semibold text-slate-600">Auto Assigned</span>
          </div>
          <div className="text-2xl font-bold text-slate-800">{data.autoAssignedToday}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><FiAlertCircle size={18} /></div>
            <span className="text-sm font-semibold text-slate-600">Pending Assignment</span>
          </div>
          <div className="text-2xl font-bold text-slate-800">{data.pendingAssignment}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg"><FiXCircle size={18} /></div>
            <span className="text-sm font-semibold text-slate-600">Critical Active</span>
          </div>
          <div className="text-2xl font-bold text-slate-800">{data.criticalComplaints}</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Workload */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Department Workload</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentChartData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} width={100} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value, name) => [value, name === 'totalWorkload' ? 'Active Cases' : name === 'available' ? 'Available Officers' : name]}
                />
                <Bar dataKey="totalWorkload" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Active Cases" />
                <Bar dataKey="available" fill="#10b981" radius={[0, 4, 4, 0]} name="Available Officers" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Officer Workload */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Officer Workload (Top 15)</h3>
          <div className="h-72">
            {officerChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={officerChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="workload" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Active Cases" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">No officers found</div>
            )}
          </div>
        </div>
      </div>

      {/* Department Details with Officers */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-800">Department & Officer Details</h2>
        {Object.entries(data.departments || {}).map(([dept, info]) => (
          <div key={dept} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-slate-800">{dept}</h3>
                <p className="text-xs text-slate-500">
                  {info.availableOfficers} of {info.totalOfficers} officers available
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-medium">
                  {info.officers.reduce((s, o) => s + o.workload, 0)} active cases
                </span>
              </div>
            </div>

            {info.officers.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">No officers in this department</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {info.officers.map((officer) => {
                  const statusInfo = STATUS_LABELS[officer.availabilityStatus] || STATUS_LABELS.active;
                  return (
                    <div key={officer._id} className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${statusInfo.dot}`}></div>
                        <div>
                          <div className="font-medium text-slate-800 text-sm">{officer.name}</div>
                          <div className="text-xs text-slate-500">{officer.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold text-slate-700">
                          {officer.workload} active {officer.workload === 1 ? 'case' : 'cases'}
                        </span>

                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>

                        <select
                          value={officer.availabilityStatus}
                          onChange={(e) => updateAvailability(officer._id, e.target.value)}
                          disabled={updating === officer._id}
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
                        >
                          <option value="active">Active</option>
                          <option value="busy">Busy</option>
                          <option value="on_leave">On Leave</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
