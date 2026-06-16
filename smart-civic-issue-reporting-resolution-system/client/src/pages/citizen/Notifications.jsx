import React, { useEffect, useState } from 'react';
import axios from '../../api/axios';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    axios.get('/citizen/notifications', { params: { page, limit: 20 } }).then((res) => {
      setNotifications(res.data.data.notifications || []);
      setUnreadCount(res.data.data.unreadCount || 0);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page]);

  const markReadAndGo = (n) => {
    if (!n.isRead) axios.patch(`/citizen/notifications/${n._id}/read`).catch(() => {});
    if (n.relatedComplaint) navigate(`/citizen/complaints/${n.relatedComplaint}`);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <div>
          <button onClick={() => axios.patch('/citizen/notifications/mark-all-read').then(load)} className="px-3 py-2 border rounded">Mark all as read</button>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex space-x-3">
          <button className="px-3 py-1 border rounded bg-white">All</button>
          <button className="px-3 py-1 border rounded bg-white">Unread ({unreadCount})</button>
          <button className="px-3 py-1 border rounded bg-white">Complaint Updates</button>
          <button className="px-3 py-1 border rounded bg-white">System</button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map((i) => <div key={i} className="animate-pulse h-12 bg-white border rounded" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No notifications yet</div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n._id} onClick={() => markReadAndGo(n)} className={`p-3 border rounded cursor-pointer flex justify-between items-center ${!n.isRead ? 'bg-blue-50' : 'bg-white'}`}>
              <div className="flex items-start">
                <div className="mr-3 text-2xl">{iconForType(n.type)}</div>
                <div>
                  <div className={`font-medium ${!n.isRead ? 'font-semibold' : ''}`}>{n.title}</div>
                  <div className="text-sm text-gray-600">{n.message}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</div>
                {!n.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-center mt-6">
        <button disabled={page<=1} onClick={() => setPage(p=>p-1)} className="px-3 py-1 border rounded mr-2">Prev</button>
        <button onClick={() => setPage(p=>p+1)} className="px-3 py-1 border rounded">Next</button>
      </div>
    </div>
  );
}

function iconForType(type) {
  const map = {
    complaint_submitted: '🔔',
    complaint_verified: '✅',
    complaint_rejected: '⚠️',
    duplicate_linked: '👥',
    department_assigned: '🏛️',
    task_assigned: '🧰',
    work_in_progress: '⏳',
    complaint_resolved: '🎉',
    feedback_request: '✉️',
    general: 'ℹ️',
  };
  return map[type] || '🔔';
}
