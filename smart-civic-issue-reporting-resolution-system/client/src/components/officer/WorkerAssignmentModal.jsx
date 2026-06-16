import React, { useState, useEffect } from 'react';
import { http } from '../../api/http';
import { toast } from 'react-toastify';
import Modal from '../ui/Modal';
import { FiUserCheck } from 'react-icons/fi';

export default function WorkerAssignmentModal({ isOpen, complaint, onClose, onSuccess }) {
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedWorker('');
      setInstructions('');
      http.get('/officer/workers')
        .then(r => { if (r.data.success) setWorkers(r.data.data); })
        .catch(() => toast.error('Failed to load workers'));
    }
  }, [isOpen]);

  const handleAssign = async () => {
    if (!selectedWorker) return toast.warn('Please select a worker');
    if (!complaint) return;
    setLoading(true);
    try {
      const res = await http.post(`/officer/complaints/${complaint._id}/assign-worker`, {
        workerId: selectedWorker,
        instructions,
      });
      if (res.data.success) {
        toast.success('Worker assigned successfully');
        onSuccess();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed');
    } finally {
      setLoading(false);
    }
  };

  if (!complaint) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assign Worker — ${complaint.complaintId}`}>
      <div className="space-y-5">
        <div>
          <p className="text-sm text-slate-600 mb-1 font-medium">{complaint.title}</p>
          <p className="text-xs text-slate-400">{complaint.location?.address}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-3">Select Worker</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {workers.length === 0 && (
              <p className="text-sm text-slate-500 italic">No active workers in your department.</p>
            )}
            {workers.map(({ worker, activeTaskCount }) => (
              <label
                key={worker._id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedWorker === worker._id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
              >
                <input
                  type="radio"
                  name="worker"
                  className="shrink-0"
                  checked={selectedWorker === worker._id}
                  onChange={() => setSelectedWorker(worker._id)}
                />
                <div className="flex-1">
                  <div className="font-medium text-slate-800 text-sm">{worker.name}</div>
                  <div className="text-xs text-slate-500">{worker.employeeId} • {worker.phone}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${activeTaskCount > 0 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {activeTaskCount > 0 ? `${activeTaskCount} active` : 'Available'}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Instructions (Optional)</label>
          <textarea
            className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            placeholder="Describe the work to be done..."
          />
        </div>

        <div className="flex gap-3 border-t border-slate-100 pt-4">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium">Cancel</button>
          <button
            onClick={handleAssign}
            disabled={loading || !selectedWorker}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium shadow-sm"
          >
            <FiUserCheck /> {loading ? 'Assigning...' : 'Confirm Assignment'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
