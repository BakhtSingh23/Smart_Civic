import React, { useState, useEffect } from 'react';
import { http } from '../../api/http';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  FiClipboard, FiUsers, FiAlertCircle, FiCheckCircle,
  FiClock, FiArrowRight
} from 'react-icons/fi';

export default function OfficerDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    http.get('/officer/dashboard')
      .then(r => { if (r.data.success) setStats(r.data.data); })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-8 space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-xl" />)}
    </div>
  );

  if (!stats) return <div className="p-8 text-center text-slate-500">Failed to load data.</div>;

  const statCards = [
    { label: 'Total Assigned', value: stats.totalAssigned, icon: FiClipboard, color: 'bg-blue-50 text-blue-600' },
    { label: 'Workers Active', value: stats.workersActive, icon: FiUsers, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Pending Verification', value: stats.pendingVerification, icon: FiAlertCircle, color: 'bg-amber-50 text-amber-600' },
    { label: 'Completed This Week', value: stats.completedThisWeek, icon: FiCheckCircle, color: 'bg-indigo-50 text-indigo-600' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Officer Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${card.color}`}><card.icon size={22} /></div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{card.value}</div>
              <div className="text-xs text-slate-500">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Needs Assignment */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <FiClock className="text-amber-500" /> Needs Worker Assignment
            </h3>
            <Link to="/officer/complaints" className="text-sm text-blue-600 hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {stats.needsAssignment?.length === 0 && (
              <p className="p-4 text-sm text-slate-500">All complaints have workers assigned. ✅</p>
            )}
            {stats.needsAssignment?.map(c => (
              <div key={c._id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                <div>
                  <p className="font-medium text-sm text-slate-800">{c.complaintId}</p>
                  <p className="text-xs text-slate-500 line-clamp-1">{c.title}</p>
                  <p className="text-xs text-amber-600 mt-1">{formatDistanceToNow(new Date(c.createdAt))} ago</p>
                </div>
                <Link to={`/officer/complaints/${c._id}`} className="ml-4 p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors">
                  <FiArrowRight />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Needs Verification */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <FiAlertCircle className="text-orange-500" /> Awaiting Your Verification
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {stats.needsVerification?.length === 0 && (
              <p className="p-4 text-sm text-slate-500">No tasks awaiting verification. ✅</p>
            )}
            {stats.needsVerification?.map(task => (
              <div key={task._id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                <div>
                  <p className="font-medium text-sm text-slate-800">{task.complaint?.complaintId}</p>
                  <p className="text-xs text-slate-500 line-clamp-1">{task.complaint?.title}</p>
                  <p className="text-xs text-slate-400 mt-1">Worker: {task.assignedWorker?.name}</p>
                </div>
                <Link to={`/officer/complaints/${task.complaint?._id}`} className="ml-4 p-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg transition-colors">
                  <FiArrowRight />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Workers Status Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2"><FiUsers /> My Department Workers</h3>
        </div>
        {stats.workers?.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">No workers in your department.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {stats.workers?.map(({ worker, activeTaskCount }) => (
              <div key={worker._id} className="flex flex-col items-center p-4 bg-slate-50 rounded-xl border border-slate-100 text-center hover:shadow-sm transition-shadow">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-bold mb-2">
                  {worker.name?.[0]}
                </div>
                <p className="font-semibold text-slate-800 text-sm">{worker.name}</p>
                <p className="text-xs text-slate-500">{worker.employeeId}</p>
                <span className={`mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${activeTaskCount > 0 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {activeTaskCount > 0 ? `${activeTaskCount} active` : 'Available'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
