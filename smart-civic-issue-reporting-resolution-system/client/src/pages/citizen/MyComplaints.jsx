import React, { useEffect, useState } from 'react';
import axios from '../../api/axios';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  verified: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  assigned: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

function CategoryIcon({ category }) {
  const map = {
    Roads: '🛣️',
    Water: '💧',
    Sanitation: '🗑️',
    Electricity: '⚡',
    Drainage: '🌊',
    Other: '📍',
  };
  return <span className="text-2xl mr-3">{map[category] || '📍'}</span>;
}

export default function MyComplaints() {
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    const params = { page, limit: 10 };
    if (status) params.status = status;
    if (query) params.search = query;
    axios
      .get('/citizen/complaints', { params })
      .then((res) => {
        if (!isMounted) return;
        console.log('Fetched complaints response:', res.data);
        const d = res.data.data;
        setComplaints(d.complaints || []);
        setTotalPages(d.totalPages || 1);
      })
      .catch((err) => {
        console.error('Error fetching complaints:', err.response?.data || err.message);
      })
      .finally(() => isMounted && setLoading(false));
    return () => {
      isMounted = false;
    };
  }, [page, status, query]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">My Complaints <span className="ml-2 text-sm text-gray-500">({/* total badge could be added */})</span></h1>
        <div className="flex space-x-3">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by title or ID" className="border rounded px-3 py-2" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded px-3 py-2">
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse border rounded p-4 bg-white" />
          ))}
        </div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500">No complaints found. Report your first issue!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((c) => (
            <div key={c._id} className="border rounded p-4 bg-white shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center">
                    <div className="text-sm text-gray-600 mr-3">{c.complaintId}</div>
                    <div className={`px-2 py-1 rounded text-sm ${statusColors[c.status] || 'bg-gray-100 text-gray-800'}`}>{c.status}</div>
                    <div className="ml-3 px-2 py-1 rounded text-sm bg-gray-50 text-gray-700">{c.priority}</div>
                  </div>
                  <div className="flex items-center mt-3">
                    <CategoryIcon category={c.category} />
                    <div>
                      <div className="font-semibold text-lg">{c.title}</div>
                      <div className="text-gray-600 truncate" style={{ maxWidth: 700 }}>{c.description}</div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">{new Date(c.createdAt).toLocaleString()}</div>
                  <div className="mt-6">
                    {c.isDuplicate && c.incidentGroup ? (
                      <div className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm">Linked to {c.incidentGroup.incidentId}</div>
                    ) : null}
                    <button onClick={() => navigate(`/citizen/complaints/${c._id}`)} className="ml-3 px-3 py-1 border rounded text-sm text-blue-600">View Details</button>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-500 flex items-center">
                <span className="mr-2">📍</span>
                <span>{c.location && c.location.address ? c.location.address : 'Location not set'}</span>
                <span className="ml-4">• {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
              </div>
            </div>
          ))}

          <div className="flex justify-center space-x-2 mt-4">
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 border rounded disabled:opacity-50">Previous</button>
            <div className="px-3 py-1 border rounded">Page {page} / {totalPages}</div>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
