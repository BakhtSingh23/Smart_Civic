import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { http } from '../../api/http';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';
import { FiFilter, FiSearch, FiMapPin, FiCamera, FiVideo, FiCheckCircle, FiXCircle, FiEye } from 'react-icons/fi';
import Modal from '../../components/ui/Modal';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function PendingComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  const [filters, setFilters] = useState({ category: '', priority: '', search: '' });
  
  // Modals state
  const [verifyModal, setVerifyModal] = useState({ isOpen: false, complaint: null, adminNote: '' });
  const [rejectModal, setRejectModal] = useState({ isOpen: false, complaint: null, reason: 'Spam/Fake', customReason: '' });
  const [mapModal, setMapModal] = useState({ isOpen: false, coords: null });
  
  // Duplicates
  const [duplicates, setDuplicates] = useState(null);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ status: 'pending', ...filters }).toString();
      const res = await http.get(`/admin/complaints?${query}`);
      if (res.data.success) {
        setComplaints(res.data.data.complaints);
        setTotal(res.data.data.total);
      }
    } catch (err) {
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [filters]);

  const handleVerify = async () => {
    try {
      const res = await http.patch(`/admin/complaints/${verifyModal.complaint._id}/verify`, {
        action: 'verify',
        adminNote: verifyModal.adminNote
      }, {});
      
      if (res.data.success) {
        toast.success('Complaint verified');
        setVerifyModal({ isOpen: false, complaint: null, adminNote: '' });
        setDuplicates(null);
        fetchComplaints();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    }
  };

  const handleReject = async () => {
    try {
      const reason = rejectModal.reason === 'Other' ? rejectModal.customReason : rejectModal.reason;
      const res = await http.patch(`/admin/complaints/${rejectModal.complaint._id}/verify`, {
        action: 'reject',
        rejectionReason: reason
      }, {});
      
      if (res.data.success) {
        toast.success('Complaint rejected');
        setRejectModal({ isOpen: false, complaint: null, reason: 'Spam/Fake', customReason: '' });
        fetchComplaints();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    }
  };

  const checkDuplicates = async (id) => {
    setCheckingDuplicates(true);
    try {
      const res = await http.get(`/admin/complaints/${id}/check-duplicates`);
      if (res.data.success) {
        setDuplicates(res.data.data.duplicates);
        if (!res.data.data.hasDuplicates) {
          toast.info('No duplicates found.');
        }
      }
    } catch (err) {
      toast.error('Failed to check duplicates');
    } finally {
      setCheckingDuplicates(false);
    }
  };

  const getPriorityColor = (p) => {
    const colors = { low: 'bg-slate-100 text-slate-700', medium: 'bg-blue-100 text-blue-700', high: 'bg-orange-100 text-orange-700', urgent: 'bg-red-100 text-red-700' };
    return colors[p] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          Pending Complaints
          {total > 0 && <span className="bg-red-500 text-white text-sm px-2.5 py-0.5 rounded-full">{total}</span>}
        </h1>
      </div>

      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex-1 min-w-[200px]">
          <FiSearch className="text-slate-400 mr-2" />
          <input 
            type="text" 
            placeholder="Search ID or Title..." 
            className="bg-transparent border-none outline-none w-full text-sm"
            value={filters.search}
            onChange={e => setFilters({...filters, search: e.target.value})}
          />
        </div>
        <select 
          className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-4 py-2"
          value={filters.category}
          onChange={e => setFilters({...filters, category: e.target.value})}
        >
          <option value="">All Categories</option>
          <option value="Roads">Roads</option>
          <option value="Water">Water</option>
          <option value="Sanitation">Sanitation</option>
          <option value="Electricity">Electricity</option>
          <option value="Drainage">Drainage</option>
          <option value="Other">Other</option>
        </select>
        <select 
          className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-4 py-2"
          value={filters.priority}
          onChange={e => setFilters({...filters, priority: e.target.value})}
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="bg-slate-100 animate-pulse h-32 rounded-xl"></div>)}
        </div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-white rounded-xl shadow-sm border border-slate-100">
          No pending complaints found.
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map(comp => (
            <div key={comp._id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col md:flex-row gap-5 hover:shadow-md transition-shadow">
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{comp.complaintId}</span>
                      <span className="text-xs text-slate-500">• {formatDistanceToNow(new Date(comp.createdAt))} ago</span>
                    </div>
                    <div className="text-sm text-slate-500 mt-0.5">
                      {comp.citizen?.name} ({comp.citizen?.email})
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{comp.category}</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(comp.priority)} uppercase`}>{comp.priority}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-slate-900 line-clamp-1">{comp.title}</h3>
                  <p className="text-sm text-slate-600 line-clamp-2 mt-1">{comp.description}</p>
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                  <button 
                    onClick={() => setMapModal({ isOpen: true, coords: comp.location.coordinates })}
                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700"
                  >
                    <FiMapPin /> View on Map
                  </button>
                  <div className="flex items-center gap-3 text-slate-500">
                    <span className="flex items-center gap-1"><FiCamera /> {comp.media?.filter(m => m.match(/\.(jpeg|jpg|gif|png)$/i)).length || 0}</span>
                    <span className="flex items-center gap-1"><FiVideo /> {comp.media?.filter(m => m.match(/\.(mp4|webm|ogg)$/i)).length || 0}</span>
                  </div>
                </div>
              </div>

              <div className="flex md:flex-col gap-2 justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-5 min-w-[140px]">
                <button 
                  onClick={() => setVerifyModal({ isOpen: true, complaint: comp, adminNote: '' })}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <FiCheckCircle /> Verify
                </button>
                <button 
                  onClick={() => setRejectModal({ isOpen: true, complaint: comp, reason: 'Spam/Fake', customReason: '' })}
                  className="flex-1 flex items-center justify-center gap-2 bg-rose-50 text-rose-700 hover:bg-rose-100 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <FiXCircle /> Reject
                </button>
                <Link 
                  to={`/admin/complaints/${comp._id}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-50 text-slate-700 hover:bg-slate-100 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <FiEye /> Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={verifyModal.isOpen} onClose={() => { setVerifyModal({isOpen: false, complaint: null, adminNote: ''}); setDuplicates(null); }} title="Verify Complaint">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Admin Note (Optional)</label>
            <textarea 
              className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              rows="3"
              value={verifyModal.adminNote}
              onChange={e => setVerifyModal({...verifyModal, adminNote: e.target.value})}
              placeholder="Add internal notes..."
            />
          </div>

          {!duplicates && (
            <button 
              onClick={() => checkDuplicates(verifyModal.complaint._id)}
              disabled={checkingDuplicates}
              className="w-full border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 py-2 rounded-lg font-medium flex items-center justify-center transition-colors"
            >
              {checkingDuplicates ? 'Scanning...' : 'Scan for Duplicates First'}
            </button>
          )}

          {duplicates && duplicates.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
              <h4 className="text-amber-800 font-medium text-sm mb-2">⚠️ Found {duplicates.length} possible duplicates</h4>
              <ul className="space-y-2 text-sm text-amber-700 max-h-32 overflow-y-auto">
                {duplicates.map(d => (
                  <li key={d._id} className="bg-white/50 px-2 py-1 rounded border border-amber-100">
                    <span className="font-semibold">{d.complaintId}</span> - {d.title}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-amber-600 mt-2">You can merge them in the detail page later.</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button onClick={() => setVerifyModal({isOpen: false, complaint: null})} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium text-slate-700">Cancel</button>
            <button onClick={handleVerify} className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium text-white shadow-sm">Confirm Verify</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={rejectModal.isOpen} onClose={() => setRejectModal({isOpen: false, complaint: null, reason: 'Spam/Fake', customReason: ''})} title="Reject Complaint">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Rejection Reason</label>
            <select 
              className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none"
              value={rejectModal.reason}
              onChange={e => setRejectModal({...rejectModal, reason: e.target.value})}
            >
              <option>Spam/Fake</option>
              <option>Insufficient Information</option>
              <option>Duplicate (already exists)</option>
              <option>Outside Jurisdiction</option>
              <option>Other</option>
            </select>
          </div>
          
          {rejectModal.reason === 'Other' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Custom Reason</label>
              <textarea 
                className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none"
                rows="3"
                value={rejectModal.customReason}
                onChange={e => setRejectModal({...rejectModal, customReason: e.target.value})}
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button onClick={() => setRejectModal({isOpen: false, complaint: null})} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium text-slate-700">Cancel</button>
            <button onClick={handleReject} className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-lg font-medium text-white shadow-sm">Confirm Reject</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={mapModal.isOpen} onClose={() => setMapModal({isOpen: false, coords: null})} title="Location">
        {mapModal.coords && (
          <div className="h-64 rounded-lg overflow-hidden relative z-0">
            <MapContainer center={[mapModal.coords[1], mapModal.coords[0]]} zoom={15} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[mapModal.coords[1], mapModal.coords[0]]} />
            </MapContainer>
          </div>
        )}
      </Modal>

    </div>
  );
}
