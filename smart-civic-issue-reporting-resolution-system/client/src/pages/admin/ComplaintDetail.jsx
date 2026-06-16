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
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function ComplaintDetail() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [officers, setOfficers] = useState([]);
  const [assignForm, setAssignForm] = useState({ department: '', officerId: '' });
  
  const [duplicates, setDuplicates] = useState([]);
  const [selectedDuplicates, setSelectedDuplicates] = useState([]);
  const [scanning, setScanning] = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await http.get(`/admin/complaints/${id}`);
      if (res.data.success) {
        setComplaint(res.data.data.complaint);
      }
    } catch (err) {
      toast.error('Failed to load complaint');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  useEffect(() => {
    if (assignForm.department) {
      http.get(`/admin/officers/by-department?department=${assignForm.department}`)
        .then(res => {
          if(res.data.success) setOfficers(res.data.data);
        })
        .catch(() => toast.error('Failed to load officers'));
    } else {
      setOfficers([]);
    }
  }, [assignForm.department]);

  const handleAction = async (action) => {
    try {
      const res = await http.patch(`/admin/complaints/${id}/verify`, { action, adminNote: '' });
      if(res.data.success) {
        toast.success(`Complaint ${action}ed`);
        fetchDetail();
      }
    } catch(err) {
      toast.error('Action failed');
    }
  };

  const handleAssign = async () => {
    if (!assignForm.department || !assignForm.officerId) return toast.warn('Select department and officer');
    try {
      const res = await http.patch(`/admin/complaints/${id}/assign`, assignForm);
      if (res.data.success) {
        toast.success('Assigned successfully');
        fetchDetail();
      }
    } catch (err) {
      toast.error('Failed to assign');
    }
  };

  const handleClose = async () => {
    try {
      const res = await http.patch(`/admin/complaints/${id}/close`, {});
      if (res.data.success) {
        toast.success('Complaint closed');
        fetchDetail();
      }
    } catch (err) {
      toast.error('Failed to close');
    }
  };

  const scanDuplicates = async () => {
    setScanning(true);
    try {
      const res = await http.get(`/admin/complaints/${id}/check-duplicates`);
      if (res.data.success) {
        setDuplicates(res.data.data.duplicates);
        if (res.data.data.duplicates.length === 0) toast.info('No duplicates found');
      }
    } catch (err) {
      toast.error('Failed to scan');
    } finally {
      setScanning(false);
    }
  };

  const mergeDuplicates = async () => {
    if (selectedDuplicates.length === 0) return;
    try {
      const res = await http.post(`/admin/incidents/merge`, {
        primaryComplaintId: id,
        duplicateComplaintIds: selectedDuplicates
      });
      if (res.data.success) {
        toast.success('Merged successfully');
        setDuplicates([]);
        setSelectedDuplicates([]);
        fetchDetail();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Merge failed');
    }
  };

  const toggleDuplicate = (dupId) => {
    setSelectedDuplicates(prev => prev.includes(dupId) ? prev.filter(i => i !== dupId) : [...prev, dupId]);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;
  if (!complaint) return <div className="p-8 text-center text-slate-500">Complaint not found.</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Header section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{complaint.complaintId}</h1>
              <p className="text-sm text-slate-500 mt-1">Submitted on {format(new Date(complaint.createdAt), 'PPpp')}</p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700 uppercase">{complaint.status}</span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 uppercase">{complaint.priority}</span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 mt-4">
            <h2 className="text-lg font-semibold text-slate-800">{complaint.title}</h2>
            <p className="text-slate-600 mt-2 whitespace-pre-wrap">{complaint.description}</p>
          </div>
        </div>

        {/* Citizen Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-3 border-b border-slate-100 pb-2">Citizen Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-slate-500 block">Name</span><span className="font-medium">{complaint.citizen?.name}</span></div>
            <div><span className="text-slate-500 block">Email</span><span className="font-medium">{complaint.citizen?.email}</span></div>
            <div><span className="text-slate-500 block">Phone</span><span className="font-medium">{complaint.citizen?.phone || 'N/A'}</span></div>
          </div>
        </div>

        {/* Map */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-3 border-b border-slate-100 pb-2">Location</h3>
          <p className="text-sm text-slate-600 mb-4">{complaint.location?.address || 'Address not provided'}</p>
          <div className="h-[300px] rounded-lg overflow-hidden relative z-0 border border-slate-200">
            {complaint.location?.coordinates && (
              <MapContainer center={[complaint.location.coordinates[1], complaint.location.coordinates[0]]} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[complaint.location.coordinates[1], complaint.location.coordinates[0]]}>
                  <Popup>{complaint.complaintId}</Popup>
                </Marker>
              </MapContainer>
            )}
          </div>
        </div>

        {/* Media */}
        {complaint.media && complaint.media.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-3 border-b border-slate-100 pb-2">Media Gallery</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {complaint.media.map((url, i) => (
                url.match(/\.(mp4|webm|ogg)$/i) ? 
                  <video key={i} src={url} controls className="w-full h-32 object-cover rounded-lg border border-slate-200" /> :
                  <img key={i} src={url} alt={`Media ${i}`} className="w-full h-32 object-cover rounded-lg border border-slate-200" />
              ))}
            </div>
          </div>
        )}

        {/* Duplicate Detection */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
            <h3 className="font-semibold text-slate-800">Duplicate Detection</h3>
            <button onClick={scanDuplicates} disabled={scanning} className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors">
              {scanning ? 'Scanning...' : 'Scan for Duplicates'}
            </button>
          </div>
          
          {complaint.incidentGroup ? (
            <div className="bg-emerald-50 text-emerald-800 p-4 rounded-lg text-sm flex justify-between items-center">
              <span>This complaint is part of Incident Group <strong>{complaint.incidentGroup.incidentId || 'linked'}</strong>.</span>
              <Link to="/admin/incidents" className="underline font-medium">View Groups</Link>
            </div>
          ) : duplicates.length > 0 ? (
            <div className="space-y-3">
              <div className="max-h-64 overflow-y-auto space-y-2 border border-slate-100 rounded-lg p-2 bg-slate-50">
                {duplicates.map(dup => (
                  <label key={dup._id} className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <input 
                      type="checkbox" 
                      className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300"
                      checked={selectedDuplicates.includes(dup._id)}
                      onChange={() => toggleDuplicate(dup._id)}
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-slate-800">{dup.complaintId} <span className="text-xs font-normal text-slate-500">• {format(new Date(dup.createdAt), 'MMM d, yyyy')}</span></div>
                      <div className="text-sm text-slate-600 mt-0.5 line-clamp-1">{dup.title}</div>
                      <div className="text-xs text-slate-500 mt-1">Reporter: {dup.citizen?.name || 'Unknown'}</div>
                    </div>
                  </label>
                ))}
              </div>
              {selectedDuplicates.length > 0 && (
                <button onClick={mergeDuplicates} className="w-full bg-indigo-600 text-white font-medium py-2.5 rounded-lg hover:bg-indigo-700 transition-colors">
                  Merge Selected into Group
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">No duplicates found or not scanned yet.</p>
          )}
        </div>

      </div>

      {/* Sidebar Action Panel */}
      <div className="space-y-6">
        
        {/* Actions */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-6">
          <h3 className="font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Actions</h3>
          
          <div className="mb-6">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Current Status</div>
            <div className="text-lg font-bold capitalize text-slate-800">{complaint.status}</div>
          </div>

          <div className="space-y-3">
            {complaint.status === 'pending' && (
              <div className="flex gap-2">
                <button onClick={() => handleAction('verify')} className="flex-1 bg-emerald-50 text-emerald-700 font-medium py-2 rounded hover:bg-emerald-100">Verify</button>
                <button onClick={() => handleAction('reject')} className="flex-1 bg-rose-50 text-rose-700 font-medium py-2 rounded hover:bg-rose-100">Reject</button>
              </div>
            )}

            {complaint.status === 'verified' && (
              <div className="space-y-3 border-t border-slate-100 pt-3">
                <h4 className="text-sm font-medium text-slate-700">Assign Department</h4>
                <select className="w-full border border-slate-200 rounded p-2 text-sm" value={assignForm.department} onChange={e => setAssignForm({...assignForm, department: e.target.value})}>
                  <option value="">Select Department</option>
                  <option value="Roads">Roads</option>
                  <option value="Water">Water</option>
                  <option value="Sanitation">Sanitation</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Drainage">Drainage</option>
                </select>
                <select className="w-full border border-slate-200 rounded p-2 text-sm" value={assignForm.officerId} onChange={e => setAssignForm({...assignForm, officerId: e.target.value})}>
                  <option value="">Select Officer</option>
                  {officers.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
                </select>
                <button onClick={handleAssign} className="w-full bg-blue-600 text-white font-medium py-2 rounded hover:bg-blue-700">Assign</button>
              </div>
            )}

            {(complaint.status === 'assigned' || complaint.status === 'in_progress') && (
              <button onClick={handleClose} className="w-full bg-slate-800 text-white font-medium py-2 rounded hover:bg-slate-900">Close Complaint</button>
            )}
            
            {['closed', 'rejected'].includes(complaint.status) && (
              <p className="text-sm text-slate-500 italic text-center">No further actions available.</p>
            )}
          </div>
        </div>

        {/* Status History */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Status History</h3>
          <div className="space-y-4">
            {complaint.statusHistory?.map((hist, i) => (
              <div key={i} className="flex gap-3 relative">
                {i !== complaint.statusHistory.length - 1 && <div className="absolute left-1.5 top-6 bottom-[-16px] w-0.5 bg-slate-100"></div>}
                <div className="w-3 h-3 rounded-full bg-blue-500 mt-1.5 relative z-10 shrink-0"></div>
                <div>
                  <div className="text-sm font-semibold capitalize text-slate-800">{hist.status}</div>
                  <div className="text-xs text-slate-500 mb-1">{format(new Date(hist.timestamp), 'PP p')}</div>
                  {hist.note && <div className="text-xs bg-slate-50 p-2 rounded border border-slate-100 text-slate-600 mt-1">{hist.note}</div>}
                  {hist.updatedBy && <div className="text-xs text-slate-400 mt-1">By: {hist.updatedBy.name}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
