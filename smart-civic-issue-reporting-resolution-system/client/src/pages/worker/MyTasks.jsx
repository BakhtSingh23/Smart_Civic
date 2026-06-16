import React, { useState, useEffect } from 'react';
import { http } from '../../api/http';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FiMapPin, FiClock, FiArrowRight, FiCheckCircle } from 'react-icons/fi';

const TABS = [
  { label: 'Pending', value: 'assigned' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
];

const STATUS_COLOR = {
  assigned: 'bg-amber-100 text-amber-700',
  accepted: 'bg-sky-100 text-sky-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  verified: 'bg-green-100 text-green-700',
  reassigned: 'bg-rose-100 text-rose-700',
};

const CATEGORY_COLOR = {
  Roads: 'bg-amber-50 text-amber-600',
  Water: 'bg-blue-50 text-blue-600',
  Sanitation: 'bg-emerald-50 text-emerald-600',
  Electricity: 'bg-orange-50 text-orange-600',
  Drainage: 'bg-purple-50 text-purple-600',
  Other: 'bg-slate-100 text-slate-600',
};

export default function MyTasks() {
  const [tab, setTab] = useState('assigned');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    http.get(`/worker/tasks?status=${tab}`)
      .then(r => { if (r.data.success) setTasks(r.data.data.tasks); })
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false));
  }, [tab]);

  const getActionButton = (task) => {
    if (task.status === 'assigned' || task.status === 'accepted') {
      return (
        <Link
          to={`/worker/tasks/${task._id}`}
          className="block w-full text-center py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          Start Task
        </Link>
      );
    }
    if (task.status === 'in_progress') {
      return (
        <Link
          to={`/worker/tasks/${task._id}`}
          className="block w-full text-center py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Submit Completion
        </Link>
      );
    }
    return (
      <Link
        to={`/worker/tasks/${task._id}`}
        className="block w-full text-center py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
      >
        View Details
      </Link>
    );
  };

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4 pb-10">
      <h1 className="text-xl font-bold text-slate-800">My Tasks</h1>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${tab === t.value ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-36 bg-slate-100 animate-pulse rounded-2xl" />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <FiCheckCircle size={40} className="mx-auto mb-3" />
          <p className="font-medium">No {tab.replace('_', ' ')} tasks.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <div key={task._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLOR[task.complaint?.category] || 'bg-slate-100 text-slate-600'}`}>
                      {task.complaint?.category}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLOR[task.status]}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-800 line-clamp-2 text-sm">{task.complaint?.title}</h3>
                </div>
              </div>

              {task.complaint?.location?.address && (
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <FiMapPin size={12} className="shrink-0" />
                  <span className="line-clamp-1">{task.complaint.location.address}</span>
                </p>
              )}

              {task.instructions && (
                <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg line-clamp-2 border border-slate-100">
                  📋 {task.instructions}
                </p>
              )}

              {task.assignedBy && (
                <p className="text-xs text-slate-400">👤 Assigned by: {task.assignedBy.name}</p>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <FiClock size={11} /> {formatDistanceToNow(new Date(task.createdAt))} ago
                </span>
              </div>

              {getActionButton(task)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
