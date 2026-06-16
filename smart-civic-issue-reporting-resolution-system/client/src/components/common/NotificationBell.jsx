import React, { useEffect, useState, useRef } from 'react';
import axios from '../../api/axios';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const nav = useNavigate();
  const timerRef = useRef();

  const loadCount = () => axios.get('/notifications/unread-count').then(r => setCount(r.data.data.count)).catch(()=>{});
  const loadItems = () => axios.get('/citizen/notifications', { params: { page: 1, limit: 5 } }).then(r => setItems(r.data.data.notifications || [])).catch(()=>{});

  useEffect(() => {
    loadCount();
    loadItems();
    timerRef.current = setInterval(() => loadCount(), 60000);
    return () => clearInterval(timerRef.current);
  }, []);

  const openDropdown = () => {
    setOpen(!open);
    if (!open) loadItems();
  };

  const handleClick = (n) => {
    if (!n.isRead) axios.patch(`/citizen/notifications/${n._id}/read`).catch(()=>{});
    if (n.relatedComplaint) nav(`/citizen/complaints/${n.relatedComplaint}`);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button onClick={openDropdown} className="relative p-2 rounded hover:bg-gray-100">
        <span className="text-lg">🔔</span>
        {count > 0 && <span className="absolute -top-1 -right-1 text-xs bg-red-600 text-white rounded-full px-1">{count}</span>}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg z-50">
          <div className="p-2">
            {items.length === 0 ? <div className="text-sm text-gray-500 p-3">No notifications</div> : items.map(n => (
              <div key={n._id} onClick={() => handleClick(n)} className={`p-2 rounded cursor-pointer ${!n.isRead ? 'bg-blue-50' : ''}`}>
                <div className="flex justify-between">
                  <div className="font-medium">{n.title}</div>
                  <div className="text-xs text-gray-400">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</div>
                </div>
                <div className="text-sm text-gray-600">{n.message}</div>
              </div>
            ))}
            <div className="text-center border-t mt-2 pt-2"><a href="/citizen/notifications" className="text-sm text-blue-600">View all</a></div>
          </div>
        </div>
      )}
    </div>
  );
}
