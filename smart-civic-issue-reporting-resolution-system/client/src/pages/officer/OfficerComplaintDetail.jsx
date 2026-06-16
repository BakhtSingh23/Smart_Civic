import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { http } from '../../api/http';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { FiCheckCircle, FiXCircle, FiArrowLeft } from 'react-icons/fi';
import WorkerAssignmentModal from '../../components/officer/WorkerAssignmentModal';
import Modal from '../../components/ui/Modal';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const TASK_STATUS_COLOR = {
  assigned: 'bg-amber-100 text-amber-700',
  accepted: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-emerald-100 text-emerald-700',
  verified: 'bg-green-100 text-green-700',
  reassigned: 'bg-rose-100 text-rose-700',
};

export default function OfficerComplaintDetail() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [workerTasks, setWorkerTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState(false);
  const [verifyModal, setVerifyModal] = useState({ open: false, task: null, action: '' });
  const [officerNote, setOfficerNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDetail = () => {
    setLoading(true);
    http.get(`/officer/complaints/${id}`)
      .then(r => {
        if (r.data.success) {
          setComplaint(r.data.data.complaint);
          setWorkerTasks(r.data.data.workerTasks);
        }
      })
      .catch(() => toast.error('Failed to load complaint'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDetail(); }, [id]);

  const handleVerify = async () => {
    if (!verifyModal.task) return;
    setSubmitting(true);
    try {
      const res = await http.patch(`/officer/tasks/${verifyModal.task._id}/verify`, {
        action: verifyModal.action,
        officerNote,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setVerifyModal({ open: false, task: null, action: '' });
        setOfficerNote('');
        fetchDetail();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading...</div>;
  if (!complaint) return <div className="p-8 text-center text-slate-500">Complaint not found.</div>;

  const coords = complaint.location?.coordinates;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Link to="/officer/complaints" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
        <FiArrowLeft /> Back to Complaints
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-slate-800">{complaint.complaintId}</h1>
            <p className="text-slate-500 text-sm mt-1">Submitted {format(new Date(complaint.createdAt), 'PPP')}</p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 capitalize">{complaint.status}</span>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 uppercase">{complaint.priority}</span>
          </div>
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mt-4">{complaint.title}</h2>
        <p className="text-slate-600 mt-2 whitespace-pre-wrap">{complaint.description}</p>

        {complaint.status === 'assigned' && (
          <button
            onClick={() => setAssignModal(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm"
          >
            + Assign Worker
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Citizen + Location */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-700 border-b border-slate-100 pb-2 mb-3">Citizen</h3>
            <div className="text-sm space-y-1">
              <p><span className="text-slate-500">Name:</span> <span className="font-medium">{complaint.citizen?.name}</span></p>
              <p><span className="text-slate-500">Email:</span> {complaint.citizen?.email}</p>
              <p><span className="text-slate-500">Phone:</span> {complaint.citizen?.phone || 'N/A'}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-700 border-b border-slate-100 pb-2 mb-3">Location</h3>
            <p className="text-sm text-slate-600 mb-3">{complaint.location?.address}</p>
            {coords && (
              <div className="h-52 rounded-lg overflow-hidden relative z-0">
                <MapContainer center={[coords[1], coords[0]]} zoom={15} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[coords[1], coords[0]]}>
                    <Popup>{complaint.complaintId}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            )}
          </div>
        </div>

        {/* Media */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-semibold text-slate-700 border-b border-slate-100 pb-2 mb-3">Media</h3>
          {complaint.media?.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {complaint.media.map((url, i) =>
                url.match(/\.(mp4|webm)$/i)
                  ? <video key={i} src={url} controls className="w-full h-28 object-cover rounded-lg border border-slate-200" />
                  : <img key={i} src={url} alt="" className="w-full h-28 object-cover rounded-lg border border-slate-200" />
              )}
            </div>
          ) : <p className="text-sm text-slate-400">No media attached.</p>}
        </div>
      </div>

      {/* Worker Tasks */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Worker Tasks ({workerTasks.length})</h3>
        </div>
        {workerTasks.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No worker tasks yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {workerTasks.map(task => (
              <div key={task._id} className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-slate-800">{task.taskId}</span>
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${TASK_STATUS_COLOR[task.status]}`}>{task.status}</span>
                  </div>
                  {task.status === 'completed' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setVerifyModal({ open: true, task, action: 'approve' }); setOfficerNote(''); }}
                        className="flex items-center gap-1 text-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-medium"
                      >
                        <FiCheckCircle /> Approve
                      </button>
                      <button
                        onClick={() => { setVerifyModal({ open: true, task, action: 'reject' }); setOfficerNote(''); }}
                        className="flex items-center gap-1 text-sm bg-rose-50 text-rose-700 hover:bg-rose-100 px-3 py-1.5 rounded-lg font-medium"
                      >
                        <FiXCircle /> Reject
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-sm text-slate-600">
                  <span className="text-slate-400">Worker:</span> {task.assignedWorker?.name} ({task.assignedWorker?.employeeId})
                </div>
                {task.instructions && (
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="font-medium text-slate-700">Instructions:</span> {task.instructions}
                  </p>
                )}
                {task.completionNote && (
                  <p className="text-sm text-slate-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                    <span className="font-medium text-emerald-700">Completion Note:</span> {task.completionNote}
                  </p>
                )}
                {/* Before/After Images */}
                {(task.beforeImages?.length > 0 || task.afterImages?.length > 0) && (
                  <div className="grid grid-cols-2 gap-4">
                    {task.beforeImages?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-2">Before</p>
                        <div className="grid grid-cols-2 gap-1">
                          {task.beforeImages.map((img, i) => <img key={i} src={img} alt="before" className="w-full h-20 object-cover rounded border border-slate-200" />)}
                        </div>
                      </div>
                    )}
                    {task.afterImages?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-2">After</p>
                        <div className="grid grid-cols-2 gap-1">
                          {task.afterImages.map((img, i) => <img key={i} src={img} alt="after" className="w-full h-20 object-cover rounded border border-slate-200" />)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Worker Assignment Modal */}
      <WorkerAssignmentModal
        isOpen={assignModal}
        complaint={complaint}
        onClose={() => setAssignModal(false)}
        onSuccess={() => { setAssignModal(false); fetchDetail(); }}
      />

      {/* Verify/Reject Modal */}
      <Modal
        isOpen={verifyModal.open}
        onClose={() => setVerifyModal({ open: false, task: null, action: '' })}
        title={verifyModal.action === 'approve' ? 'Approve Completion' : 'Reject Completion'}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Task: <strong>{verifyModal.task?.taskId}</strong></p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {verifyModal.action === 'approve' ? 'Officer Note (Optional)' : 'Rejection Reason'}
            </label>
            <textarea
              className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              value={officerNote}
              onChange={e => setOfficerNote(e.target.value)}
              placeholder={verifyModal.action === 'approve' ? 'Optional notes...' : 'Explain why the work was rejected...'}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={() => setVerifyModal({ open: false, task: null, action: '' })} className="flex-1 px-4 py-2 bg-slate-100 rounded-lg font-medium text-slate-700">Cancel</button>
            <button
              onClick={handleVerify}
              disabled={submitting}
              className={`flex-1 px-4 py-2 rounded-lg font-medium text-white shadow-sm ${verifyModal.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
            >
              {submitting ? 'Processing...' : verifyModal.action === 'approve' ? 'Approve' : 'Reject'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
