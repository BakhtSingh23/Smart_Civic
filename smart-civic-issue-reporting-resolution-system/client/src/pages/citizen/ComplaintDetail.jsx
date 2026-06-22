import React, { useEffect, useState } from 'react';
import { default as axios, getStaticUrl } from '../../api/axios';
import { useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

export default function ComplaintDetail() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [complaint, setComplaint] = useState(null);
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    axios.get(`/citizen/complaints/${id}`).then((res) => {
      if (!mounted) return;
      setComplaint(res.data.data.complaint);
      setLoading(false);
    }).catch(() => setLoading(false));

    axios.get(`/citizen/complaints/${id}/timeline`).then((res) => {
      if (!mounted) return;
      setTimeline(res.data.data.timeline || []);
    }).catch(() => {});

    return () => { mounted = false; };
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!complaint) return <div className="p-6">Complaint not found</div>;

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{complaint.complaintId} — {complaint.title}</h2>
          <div className="mt-2 text-sm text-gray-600">Submitted {formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true })}</div>
        </div>
        <div className="text-right">
          <div className="px-3 py-1 rounded bg-gray-100">{complaint.priority}</div>
          <div className="mt-2 px-3 py-1 rounded bg-gray-50 text-sm">{complaint.category}</div>
        </div>
      </header>

      <section className="bg-white border rounded p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
            1
          </div>
          <h3 className="font-semibold text-lg">Issue Details</h3>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Title</p>
            <p className="text-lg font-semibold text-gray-900">{complaint.title}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Description</p>
            <p className="text-gray-700 whitespace-pre-wrap">{complaint.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Category</p>
              <p className="text-gray-900">{complaint.category}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Priority</p>
              <p className="text-gray-900">{complaint.priority}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border rounded p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600">
            2
          </div>
          <h3 className="font-semibold text-lg">Location</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Address</p>
              <p className="text-gray-900 font-medium">{complaint.location?.address || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Area</p>
              <p className="text-gray-700">{complaint.location?.area || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">City & Pincode</p>
              <p className="text-gray-700">{complaint.location?.city || '—'} • {complaint.location?.pincode || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Coordinates</p>
              <p className="text-gray-700 font-mono text-sm">Lat: {complaint.location?.coordinates?.[1]?.toFixed(6) || '—'}, Lng: {complaint.location?.coordinates?.[0]?.toFixed(6) || '—'}</p>
            </div>
          </div>
          <div>
            {complaint.location?.coordinates ? (
              <div className="h-48 rounded overflow-hidden border border-gray-200">
                <MapContainer center={[complaint.location.coordinates[1], complaint.location.coordinates[0]]} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[complaint.location.coordinates[1], complaint.location.coordinates[0]]}>
                    <Popup>{complaint.location.address}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            ) : (
              <div className="h-48 rounded bg-gray-100 flex items-center justify-center border border-gray-200">
                <p className="text-gray-500">No location data available</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white border rounded p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-600">
            3
          </div>
          <h3 className="font-semibold text-lg">Media</h3>
        </div>
        {complaint.media && complaint.media.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {complaint.media.map((m) => (
              <div key={m} className="rounded overflow-hidden border border-gray-200 bg-gray-50">
                {m.endsWith('.mp4') || m.endsWith('.mov') ? (
                  <video controls className="w-full h-40 object-cover" src={getStaticUrl(m)} />
                ) : (
                  <img src={getStaticUrl(m)} alt="complaint media" className="w-full h-40 object-cover" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-6">No media uploaded for this complaint</p>
        )}
      </section>

      {complaint.isDuplicate && complaint.incidentGroup ? (
        <section className="bg-orange-50 border-l-4 border-orange-300 p-4 rounded">
          <div className="font-semibold text-orange-900">Linked to Incident {complaint.incidentGroup.incidentId}</div>
          <div className="text-sm text-orange-700 mt-1">This incident has {complaint.incidentGroup.totalReporters || 'multiple'} reporters. Your issue will be resolved together with linked reports.</div>
        </section>
      ) : null}

      <section className="bg-white border rounded p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
            4
          </div>
          <h3 className="font-semibold text-lg">Status & Review</h3>
        </div>
        <div className="space-y-3">
          {timeline.map((t) => (
            <div key={t.timestamp} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-b-0">
              <div className="w-3 h-3 rounded-full bg-green-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900 uppercase">{t.status}</div>
                <div className="text-sm text-gray-700 mt-1">{t.note}</div>
                <div className="text-xs text-gray-500 mt-1">{new Date(t.timestamp).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {['completed','closed'].includes(complaint.status) && (
        <section className="bg-white border rounded p-4">
          <h3 className="font-semibold mb-2">Resolution</h3>
          <div className="text-sm text-gray-700">{complaint.adminNote || 'No resolution note provided.'}</div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(complaint.afterImages || []).map((img) => (
              <img key={img} src={getStaticUrl(img)} className="w-full h-24 object-cover rounded" />
            ))}
          </div>
        </section>
      )}

      {/* Feedback Section handled on separate component or inline when status closed and no feedbackGiven */}
      {complaint.status === 'closed' && !complaint.feedbackGiven && (
        <section className="bg-white border rounded p-4">
          <h3 className="font-semibold mb-2">Feedback</h3>
          <FeedbackForm complaintId={complaint._id} onSubmitted={() => window.location.reload()} />
        </section>
      )}
    </div>
  );
}

function FeedbackForm({ complaintId, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [responseTime, setResponseTime] = useState('average');
  const [satisfied, setSatisfied] = useState(true);
  const [loading, setLoading] = useState(false);

  const submit = () => {
    setLoading(true);
    axios.post(`/citizen/complaints/${complaintId}/feedback`, { rating, comment, resolutionSatisfied: satisfied, responseTime })
      .then(() => { onSubmitted && onSubmitted(); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm">Rating</label>
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="border rounded px-2 py-1">
          {[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} star{n>1?'s':''}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm">Comments</label>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="w-full border rounded p-2" />
      </div>
      <div className="flex items-center space-x-3">
        <label className="text-sm">Satisfied?</label>
        <input type="checkbox" checked={satisfied} onChange={(e) => setSatisfied(e.target.checked)} />
      </div>
      <div>
        <label className="block text-sm">Response Time</label>
        <select value={responseTime} onChange={(e) => setResponseTime(e.target.value)} className="border rounded px-2 py-1">
          <option value="very_fast">Very fast</option>
          <option value="fast">Fast</option>
          <option value="average">Average</option>
          <option value="slow">Slow</option>
          <option value="very_slow">Very slow</option>
        </select>
      </div>
      <div>
        <button onClick={submit} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Submitting...' : 'Submit Feedback'}</button>
      </div>
    </div>
  );
}
