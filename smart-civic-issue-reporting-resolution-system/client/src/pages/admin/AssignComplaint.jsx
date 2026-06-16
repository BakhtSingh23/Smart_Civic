import React, { useState, useEffect } from 'react';
import { http } from '../../api/http';
import { toast } from 'react-toastify';
import { FiDroplet, FiZap, FiTrash2, FiMapPin } from 'react-icons/fi';
import Modal from '../../components/ui/Modal';

const departments = [
  { name: 'Roads', icon: FiMapPin, color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { name: 'Water', icon: FiDroplet, color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { name: 'Sanitation', icon: FiTrash2, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { name: 'Electricity', icon: FiZap, color: 'bg-amber-50 text-amber-600 border-amber-200' },
  { name: 'Drainage', icon: FiDroplet, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
];

export default function AssignComplaint({ isOpen, onClose, complaint, onSuccess }) {
  const [selectedDept, setSelectedDept] = useState('');
  const [officers, setOfficers] = useState([]);
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && complaint) {
      setSelectedDept(complaint.category || '');
      setSelectedOfficer('');
      setNote('');
    }
  }, [isOpen, complaint]);

  useEffect(() => {
    if (selectedDept) {
      http.get(`/admin/officers/by-department?department=${selectedDept}`)
        .then(res => {
          if(res.data.success) setOfficers(res.data.data);
        })
        .catch(() => toast.error('Failed to load officers'));
    } else {
      setOfficers([]);
    }
  }, [selectedDept]);

  const handleAssign = async () => {
    if (!selectedDept || !selectedOfficer) return toast.warn('Please select a department and officer');
    setLoading(true);
    try {
      const res = await http.patch(`/admin/complaints/${complaint._id}/assign`, {
        department: selectedDept,
        officerId: selectedOfficer,
        note
      });
      
      if (res.data.success) {
        toast.success('Complaint assigned successfully');
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      toast.error('Assignment failed');
    } finally {
      setLoading(false);
    }
  };

  if (!complaint) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assign Complaint: ${complaint.complaintId}`}>
      <div className="space-y-6">
        
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-3">1. Auto-Suggested Department</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {departments.map(dept => {
              const Icon = dept.icon;
              const isSelected = selectedDept === dept.name;
              return (
                <button
                  key={dept.name}
                  onClick={() => { setSelectedDept(dept.name); setSelectedOfficer(''); }}
                  className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${isSelected ? 'ring-2 ring-blue-500 shadow-md ' + dept.color : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  <Icon size={20} />
                  <span className="text-xs font-semibold">{dept.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedDept && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-3">2. Select Officer</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {officers.length === 0 ? (
                <div className="text-sm text-slate-500 italic p-3 bg-slate-50 rounded border border-slate-100">No active officers found in this department.</div>
              ) : (
                officers.map(off => (
                  <label key={off._id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedOfficer === off._id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                    <input 
                      type="radio" 
                      name="officer" 
                      className="mt-1"
                      checked={selectedOfficer === off._id}
                      onChange={() => setSelectedOfficer(off._id)}
                    />
                    <div>
                      <div className="font-medium text-sm text-slate-800">{off.name}</div>
                      <div className="text-xs text-slate-500">ID: {off.employeeId} • {off.email}</div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">Assignment Note (Optional)</h4>
          <textarea 
            className="w-full border border-slate-200 rounded p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            rows="2"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add instructions for the officer..."
          />
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors">Cancel</button>
          <button onClick={handleAssign} disabled={loading || !selectedOfficer} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium shadow-sm transition-colors">
            {loading ? 'Assigning...' : 'Confirm Assignment'}
          </button>
        </div>

      </div>
    </Modal>
  );
}
