import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { http } from '../../api/http';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { FiArrowLeft, FiNavigation, FiMapPin } from 'react-icons/fi';
import ImageUploadZone from '../../components/worker/ImageUploadZone';
import axios from 'axios';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const STATUS_COLOR = {
  assigned: 'bg-amber-100 text-amber-700',
  accepted: 'bg-sky-100 text-sky-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  verified: 'bg-green-100 text-green-700',
  reassigned: 'bg-rose-100 text-rose-700',
};

export default function TaskDetail() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  const [beforeFiles, setBeforeFiles] = useState([]);
  const [afterFiles, setAfterFiles] = useState([]);
  const [completionNote, setCompletionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchTask = () => {
    setLoading(true);
    http.get(`/worker/tasks/${id}`)
      .then(r => { if (r.data.success) setTask(r.data.data.task); })
      .catch(() => toast.error('Task not found'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTask(); }, [id]);

  const doMultipartPatch = async (url, formData) => {
    const token = localStorage.getItem('token');
    return axios.patch(`http://localhost:5000/api${url}`, formData, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      onUploadProgress: e => setUploadProgress(Math.round((e.loaded / e.total) * 100)),
    });
  };

  const handleStart = async () => {
    setActionLoading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      beforeFiles.forEach(f => formData.append('beforeImages', f));
      const res = await doMultipartPatch(`/worker/tasks/${id}/start`, formData);
      if (res.data.success) {
        toast.success('Task started!');
        setBeforeFiles([]);
        fetchTask();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start task');
    } finally {
      setActionLoading(false);
      setUploadProgress(0);
    }
  };

  const handleComplete = async () => {
    if (afterFiles.length === 0) return toast.warn('Please upload at least one after-photo');
    setActionLoading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      afterFiles.forEach(f => formData.append('afterImages', f));
      formData.append('completionNote', completionNote);
      const res = await doMultipartPatch(`/worker/tasks/${id}/complete`, formData);
      if (res.data.success) {
        toast.success('Completion submitted!');
        setAfterFiles([]);
        setCompletionNote('');
        fetchTask();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally {
      setActionLoading(false);
      setUploadProgress(0);
    }
  };

  if (loading) return <div className="p-4 text-center text-slate-500 animate-pulse">Loading task...</div>;
  if (!task) return <div className="p-4 text-center text-slate-500">Task not found.</div>;

  const complaint = task.complaint;
  const coords = complaint?.location?.coordinates;
  const isAssigned = ['assigned', 'accepted'].includes(task.status);
  const isInProgress = task.status === 'in_progress';
  const isCompleted = task.status === 'completed';
  const isVerified = task.status === 'verified';

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4 pb-12">
      <Link to="/worker/tasks" className="inline-flex items-center gap-2 text-sm text-slate-500">
        <FiArrowLeft /> Back to Tasks
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-slate-400 font-mono">{task.taskId}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLOR[task.status]}`}>
              {task.status.replace('_', ' ')}
            </span>
          </div>
          <span className="text-xs text-slate-400">{format(new Date(task.createdAt), 'PP')}</span>
        </div>

        <h1 className="text-lg font-bold text-slate-900 leading-tight">{complaint?.title}</h1>
        <p className="text-sm text-slate-600">{complaint?.description}</p>
      </div>

      {/* Officer info + instructions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-2">
        <h3 className="font-semibold text-slate-700 text-sm">Officer Instructions</h3>
        {task.assignedBy && (
          <p className="text-xs text-slate-500">By: {task.assignedBy.name} {task.assignedBy.phone ? `· ${task.assignedBy.phone}` : ''}</p>
        )}
        <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
          {task.instructions || 'No specific instructions provided.'}
        </p>
      </div>

      {/* Location */}
      {complaint?.location && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2"><FiMapPin /> Location</h3>
          <p className="text-sm text-slate-600">{complaint.location.address}</p>
          {coords && (
            <>
              <div className="h-44 rounded-xl overflow-hidden relative z-0">
                <MapContainer center={[coords[1], coords[0]]} zoom={15} style={{ height: '100%', width: '100%' }} dragging={false} zoomControl={false} scrollWheelZoom={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[coords[1], coords[0]]} />
                </MapContainer>
              </div>
              <a
                href={`https://maps.google.com/?q=${coords[1]},${coords[0]}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-sm"
              >
                <FiNavigation /> Open in Google Maps
              </a>
            </>
          )}
        </div>
      )}

      {/* Existing before images */}
      {task.beforeImages?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-2">
          <h3 className="font-semibold text-slate-700 text-sm">Before Photos</h3>
          <div className="grid grid-cols-3 gap-2">
            {task.beforeImages.map((img, i) => (
              <img key={i} src={`http://localhost:5000${img}`} alt="before" className="w-full h-24 object-cover rounded-lg border border-slate-200" />
            ))}
          </div>
        </div>
      )}

      {/* Existing after images */}
      {task.afterImages?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-2">
          <h3 className="font-semibold text-slate-700 text-sm">After Photos</h3>
          <div className="grid grid-cols-3 gap-2">
            {task.afterImages.map((img, i) => (
              <img key={i} src={`http://localhost:5000${img}`} alt="after" className="w-full h-24 object-cover rounded-lg border border-slate-200" />
            ))}
          </div>
          {task.completionNote && (
            <p className="text-sm text-emerald-700 bg-emerald-50 p-3 rounded-xl">{task.completionNote}</p>
          )}
        </div>
      )}

      {/* Start Task — Before image upload */}
      {isAssigned && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-slate-700 text-sm">Start Task</h3>
          <ImageUploadZone
            label="📸 Before Photos (optional)"
            files={beforeFiles}
            onChange={setBeforeFiles}
            maxFiles={3}
            uploading={actionLoading}
            progress={uploadProgress}
          />
          <button
            onClick={handleStart}
            disabled={actionLoading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-base transition-colors"
          >
            {actionLoading ? `Uploading... ${uploadProgress}%` : '▶ Start Task'}
          </button>
        </div>
      )}

      {/* Submit Completion — After image upload */}
      {isInProgress && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-slate-700 text-sm">Submit Completion</h3>
          <ImageUploadZone
            label="📸 After Photos (required)"
            files={afterFiles}
            onChange={setAfterFiles}
            maxFiles={5}
            uploading={actionLoading}
            progress={uploadProgress}
          />
          <textarea
            className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
            rows="3"
            placeholder="Describe the work done..."
            value={completionNote}
            onChange={e => setCompletionNote(e.target.value)}
          />
          <button
            onClick={handleComplete}
            disabled={actionLoading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-base transition-colors"
          >
            {actionLoading ? `Uploading... ${uploadProgress}%` : '✔ Submit Completion'}
          </button>
        </div>
      )}

      {isCompleted && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
          <p className="text-emerald-700 font-semibold">✅ Task submitted. Awaiting officer verification.</p>
        </div>
      )}

      {isVerified && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
          <p className="text-green-700 font-semibold">✅ Task verified and approved by officer.</p>
        </div>
      )}
    </div>
  );
}
