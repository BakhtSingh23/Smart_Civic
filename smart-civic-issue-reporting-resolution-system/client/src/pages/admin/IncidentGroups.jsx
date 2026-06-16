import React, { useState, useEffect } from 'react';
import { http } from '../../api/http';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { FiUsers, FiMapPin, FiEye } from 'react-icons/fi';
import Modal from '../../components/ui/Modal';
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

export default function IncidentGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  const [filters, setFilters] = useState({ status: '', department: '' });
  const [detailModal, setDetailModal] = useState({ isOpen: false, group: null });

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await http.get(`/admin/incidents?${query}`);
      if (res.data.success) {
        setGroups(res.data.data.incidents);
        setTotal(res.data.data.total);
      }
    } catch (err) {
      toast.error('Failed to load incident groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [filters]);

  const fetchGroupDetail = async (id) => {
    try {
      const res = await http.get(`/admin/incidents/${id}`);
      if (res.data.success) {
        setDetailModal({ isOpen: true, group: res.data.data });
      }
    } catch (err) {
      toast.error('Failed to load group details');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          Incident Groups
          <span className="bg-blue-100 text-blue-700 text-sm px-2.5 py-0.5 rounded-full">{total}</span>
        </h1>
      </div>

      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <select 
          className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-4 py-2"
          value={filters.status}
          onChange={e => setFilters({...filters, status: e.target.value})}
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
        <select 
          className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-4 py-2"
          value={filters.department}
          onChange={e => setFilters({...filters, department: e.target.value})}
        >
          <option value="">All Departments</option>
          <option value="Roads">Roads</option>
          <option value="Water">Water</option>
          <option value="Sanitation">Sanitation</option>
          <option value="Electricity">Electricity</option>
          <option value="Drainage">Drainage</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="bg-slate-100 animate-pulse h-32 rounded-xl"></div>)}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-white rounded-xl shadow-sm border border-slate-100">
          No incident groups found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(group => (
            <div key={group._id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{group.incidentId}</h3>
                  <p className="text-xs text-slate-500">{format(new Date(group.createdAt), 'PP')}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded uppercase ${group.status === 'open' ? 'bg-amber-100 text-amber-700' : group.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {group.status}
                </span>
              </div>
              
              <div className="mb-4">
                <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium mb-2">{group.category}</span>
                <p className="text-sm font-medium text-slate-800 line-clamp-2">{group.primaryComplaint?.title}</p>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                <FiMapPin className="shrink-0" />
                <span className="line-clamp-1">{group.location?.address || 'Location provided'}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                <FiUsers className="shrink-0 text-blue-500" />
                <span className="font-medium text-slate-800">{group.totalReporters} reporters</span>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                <div className="text-xs text-slate-500">
                  {group.assignedOfficer ? `Assigned to: ${group.assignedOfficer.name}` : 'Unassigned'}
                </div>
                <button 
                  onClick={() => fetchGroupDetail(group._id)}
                  className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <FiEye /> View Group
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={detailModal.isOpen} onClose={() => setDetailModal({isOpen: false, group: null})} title={`Incident Group: ${detailModal.group?.incidentId}`}>
        {detailModal.group && (
          <div className="space-y-6">
            <div className="flex gap-2 mb-4">
              <span className="px-3 py-1 bg-slate-100 rounded-full text-sm font-medium">{detailModal.group.category}</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium uppercase">{detailModal.group.status}</span>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium flex items-center gap-1">
                <FiUsers /> {detailModal.group.totalReporters} Reporters
              </span>
            </div>

            <div className="h-64 rounded-lg overflow-hidden relative z-0 border border-slate-200">
              <MapContainer center={[detailModal.group.location.coordinates[1], detailModal.group.location.coordinates[0]]} zoom={14} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[detailModal.group.primaryComplaint.location.coordinates[1], detailModal.group.primaryComplaint.location.coordinates[0]]}>
                  <Popup>Primary: {detailModal.group.primaryComplaint.complaintId}</Popup>
                </Marker>
                {detailModal.group.linkedComplaints?.map(comp => (
                  comp.location?.coordinates && (
                    <Marker key={comp._id} position={[comp.location.coordinates[1], comp.location.coordinates[0]]}>
                      <Popup>{comp.complaintId}</Popup>
                    </Marker>
                  )
                ))}
              </MapContainer>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Primary Complaint</h4>
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                <div className="font-semibold">{detailModal.group.primaryComplaint.complaintId}</div>
                <div className="text-sm text-slate-700 mt-1">{detailModal.group.primaryComplaint.title}</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 mb-3 flex justify-between items-center">
                Linked Complaints ({detailModal.group.linkedComplaints?.length || 0})
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                {detailModal.group.linkedComplaints?.map(comp => (
                  <div key={comp._id} className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex justify-between items-center">
                    <div>
                      <div className="font-medium text-sm text-slate-800">{comp.complaintId}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Reporter: {comp.citizen?.name}</div>
                    </div>
                    <span className="text-xs bg-slate-200 px-2 py-1 rounded capitalize">{comp.status}</span>
                  </div>
                ))}
                {(!detailModal.group.linkedComplaints || detailModal.group.linkedComplaints.length === 0) && (
                  <p className="text-sm text-slate-500 text-center py-2">No linked complaints.</p>
                )}
              </div>
            </div>

          </div>
        )}
      </Modal>

    </div>
  );
}
