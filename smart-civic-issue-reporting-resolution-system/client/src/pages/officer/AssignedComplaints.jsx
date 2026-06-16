import React, { useState, useEffect } from 'react';
import { http } from '../../api/http';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { FiMapPin, FiEye, FiUserPlus } from 'react-icons/fi';
import WorkerAssignmentModal from '../../components/officer/WorkerAssignmentModal';

const STATUSES = ['all', 'assigned', 'in_progress', 'completed'];

const PRIORITY_COLOR = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const STATUS_COLOR = {
  assigned: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  verified: 'bg-indigo-100 text-indigo-700',
};

export default function AssignedComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [assignModal, setAssignModal] = useState({ open: false, complaint: null });

  const fetchComplaints = () => {
    setLoading(true);
    const params = activeTab !== 'all' ? `?status=${activeTab}` : '';
    http.get(`/officer/complaints${params}`)
      .then(r => { if (r.data.success) setComplaints(r.data.data.complaints); })
      .catch(() => toast.error('Failed to load complaints'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchComplaints(); }, [activeTab]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Assigned Complaints</h1>

      {/* Status Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setActiveTab(s)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${activeTab === s ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-slate-100 animate-pulse rounded-xl" />)}
        </div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500">
          No complaints found.
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map(c => (
            <div key={c._id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col md:flex-row gap-4 hover:shadow-md transition-shadow">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-slate-800">{c.complaintId}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLOR[c.status] || 'bg-slate-100 text-slate-600'}`}>{c.status}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${PRIORITY_COLOR[c.priority]}`}>{c.priority}</span>
                </div>
                <h3 className="font-medium text-slate-900 line-clamp-1">{c.title}</h3>
                <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-2">
                  <span>👤 {c.citizen?.name}</span>
                  {c.location?.address && <span className="flex items-center gap-1"><FiMapPin /> {c.location.address}</span>}
                  <span>{formatDistanceToNow(new Date(c.createdAt))} ago</span>
                  {c.latestTask && <span className="text-indigo-600">🔨 {c.latestTask.assignedWorker?.name || 'Worker'} ({c.latestTask.status})</span>}
                </div>
              </div>
              <div className="flex gap-2 items-center shrink-0">
                {c.status === 'assigned' && (
                  <button
                    onClick={() => setAssignModal({ open: true, complaint: c })}
                    className="flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <FiUserPlus /> Assign Worker
                  </button>
                )}
                <Link
                  to={`/officer/complaints/${c._id}`}
                  className="flex items-center gap-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <FiEye /> View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <WorkerAssignmentModal
        isOpen={assignModal.open}
        complaint={assignModal.complaint}
        onClose={() => setAssignModal({ open: false, complaint: null })}
        onSuccess={() => { setAssignModal({ open: false, complaint: null }); fetchComplaints(); }}
      />
    </div>
  );
}
