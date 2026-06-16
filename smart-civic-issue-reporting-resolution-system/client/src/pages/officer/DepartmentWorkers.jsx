import React, { useState, useEffect } from 'react';
import { http } from '../../api/http';
import { toast } from 'react-toastify';
import { FiUser, FiPhone, FiMail } from 'react-icons/fi';

const FILTERS = ['all', 'available', 'busy'];

export default function DepartmentWorkers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    http.get('/officer/workers')
      .then(r => { if (r.data.success) setWorkers(r.data.data); })
      .catch(() => toast.error('Failed to load workers'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = workers.filter(({ activeTaskCount }) => {
    if (filter === 'available') return activeTaskCount === 0;
    if (filter === 'busy') return activeTaskCount > 0;
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Department Workers</h1>
        <span className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full font-medium">{workers.length} Total</span>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 bg-slate-100 animate-pulse rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">No workers found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(({ worker, activeTaskCount, completedTaskCount }) => (
            <div key={worker._id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-bold shrink-0">
                  {worker.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 truncate">{worker.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{worker.employeeId}</p>
                  <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${activeTaskCount > 0 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {activeTaskCount > 0 ? `${activeTaskCount} active task${activeTaskCount > 1 ? 's' : ''}` : 'Available'}
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-1.5 text-sm text-slate-600">
                {worker.phone && (
                  <div className="flex items-center gap-2"><FiPhone size={14} className="text-slate-400 shrink-0" /> {worker.phone}</div>
                )}
                <div className="flex items-center gap-2"><FiMail size={14} className="text-slate-400 shrink-0" /> <span className="truncate">{worker.email}</span></div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-xs text-slate-500">
                <span>✅ {completedTaskCount} completed</span>
                <span>🔄 {activeTaskCount} in progress</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
