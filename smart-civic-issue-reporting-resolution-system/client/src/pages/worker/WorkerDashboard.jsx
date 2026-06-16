import React, { useState, useEffect } from 'react';
import { http } from '../../api/http';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  FiCheckCircle, FiClock, FiList, FiMapPin,
  FiNavigation, FiPlayCircle, FiSend, FiArrowRight
} from 'react-icons/fi';
import ImageUploadZone from '../../components/worker/ImageUploadZone';
import axios from 'axios';

const CATEGORY_COLOR = {
  Roads: 'bg-amber-100 text-amber-700',
  Water: 'bg-blue-100 text-blue-700',
  Sanitation: 'bg-emerald-100 text-emerald-700',
  Electricity: 'bg-orange-100 text-orange-700',
  Drainage: 'bg-purple-100 text-purple-700',
  Other: 'bg-slate-100 text-slate-600',
};

export default function WorkerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Active task action state
  const [beforeFiles, setBeforeFiles] = useState([]);
  const [afterFiles, setAfterFiles] = useState([]);
  const [completionNote, setCompletionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchDashboard = () => {
    setLoading(true);
    http.get('/worker/dashboard')
      .then(r => { if (r.data.success) setData(r.data.data); })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDashboard(); }, []);

  const handleStartTask = async (taskId) => {
    setActionLoading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      beforeFiles.forEach(f => formData.append('beforeImages', f));
      const token = localStorage.getItem('token');
      const res = await axios.patch(
        `http://localhost:5000/api/worker/tasks/${taskId}/start`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
          onUploadProgress: e => setUploadProgress(Math.round((e.loaded / e.total) * 100)),
        }
      );
      if (res.data.success) {
        toast.success('Task started!');
        setBeforeFiles([]);
        fetchDashboard();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start task');
    } finally {
      setActionLoading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmitCompletion = async (taskId) => {
    if (afterFiles.length === 0) return toast.warn('Please upload at least one after-photo');
    setActionLoading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      afterFiles.forEach(f => formData.append('afterImages', f));
      if (completionNote) formData.append('completionNote', completionNote);
      const token = localStorage.getItem('token');
      const res = await axios.patch(
        `http://localhost:5000/api/worker/tasks/${taskId}/complete`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
          onUploadProgress: e => setUploadProgress(Math.round((e.loaded / e.total) * 100)),
        }
      );
      if (res.data.success) {
        toast.success('Completion submitted! Awaiting officer verification.');
        setAfterFiles([]);
        setCompletionNote('');
        fetchDashboard();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit completion');
    } finally {
      setActionLoading(false);
      setUploadProgress(0);
    }
  };

  if (loading) return (
    <div className="p-4 space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-2xl" />)}
    </div>
  );

  const activeTask = data?.activeTask;
  const complaint = activeTask?.complaint;
  const coords = complaint?.location?.coordinates;

  return (
    <div className="p-4 max-w-xl mx-auto space-y-5 pb-10">
      <h1 className="text-xl font-bold text-slate-800">My Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Pending Tasks', value: data?.pendingCount, icon: FiList, color: 'bg-amber-50 text-amber-600 border-amber-200' },
          { label: 'Active Task', value: activeTask ? 1 : 0, icon: FiPlayCircle, color: 'bg-blue-50 text-blue-600 border-blue-200' },
          { label: 'Done This Week', value: data?.completedThisWeek, icon: FiCheckCircle, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
          { label: 'All Time Done', value: data?.totalCompleted, icon: FiCheckCircle, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
        ].map(card => (
          <div key={card.label} className={`flex items-center gap-3 p-4 rounded-2xl border ${card.color}`}>
            <card.icon size={22} />
            <div>
              <div className="text-2xl font-bold">{card.value ?? 0}</div>
              <div className="text-xs leading-tight">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Task Card */}
      {activeTask && complaint && (
        <div className="bg-blue-600 text-white rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">Active Task</span>
              <h2 className="text-lg font-bold mt-1 leading-tight">{complaint.title}</h2>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold bg-white/20 text-white`}>
              {complaint.category}
            </span>
          </div>

          <p className="text-sm text-blue-100 line-clamp-3">{complaint.description}</p>

          {complaint.location?.address && (
            <div className="flex items-center gap-2 text-sm text-blue-100">
              <FiMapPin size={14} />
              <span>{complaint.location.address}</span>
            </div>
          )}

          {activeTask.instructions && (
            <div className="bg-white/15 rounded-xl p-3 text-sm">
              <span className="font-semibold text-white block mb-1">Officer Instructions:</span>
              <span className="text-blue-100">{activeTask.instructions}</span>
            </div>
          )}

          {/* Navigation button */}
          {coords && (
            <a
              href={`https://maps.google.com/?q=${coords[1]},${coords[0]}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
            >
              <FiNavigation /> Open in Google Maps
            </a>
          )}

          {/* After image upload + completion */}
          <div className="bg-white rounded-xl p-4 space-y-3">
            <ImageUploadZone
              label="📸 After Photos (required)"
              files={afterFiles}
              onChange={setAfterFiles}
              maxFiles={5}
              uploading={actionLoading}
              progress={uploadProgress}
            />
            <textarea
              className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-400"
              rows="2"
              placeholder="Completion notes (optional)..."
              value={completionNote}
              onChange={e => setCompletionNote(e.target.value)}
            />
            <button
              onClick={() => handleSubmitCompletion(activeTask._id)}
              disabled={actionLoading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-base"
            >
              <FiSend /> {actionLoading ? 'Submitting...' : 'Submit Completion'}
            </button>
          </div>
        </div>
      )}

      {/* Pending Tasks */}
      {data?.pendingTasks?.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-slate-700 mb-3">Pending Tasks</h2>
          <div className="space-y-3">
            {data.pendingTasks.map(task => (
              <div key={task._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLOR[task.complaint?.category] || 'bg-slate-100 text-slate-600'}`}>
                      {task.complaint?.category}
                    </span>
                    <h3 className="font-semibold text-slate-800 mt-1 line-clamp-2">{task.complaint?.title}</h3>
                  </div>
                </div>

                {task.complaint?.location?.address && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <FiMapPin size={12} /> {task.complaint.location.address}
                  </p>
                )}

                {task.instructions && (
                  <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg line-clamp-2">
                    {task.instructions}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <FiClock size={11} /> {formatDistanceToNow(new Date(task.createdAt))} ago
                  </span>
                  <Link
                    to={`/worker/tasks/${task._id}`}
                    className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800"
                  >
                    View & Start <FiArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!activeTask && data?.pendingTasks?.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <FiCheckCircle size={40} className="mx-auto mb-3 text-emerald-400" />
          <p className="font-medium text-slate-600">All caught up!</p>
          <p className="text-sm">No pending or active tasks right now.</p>
        </div>
      )}
    </div>
  );
}
