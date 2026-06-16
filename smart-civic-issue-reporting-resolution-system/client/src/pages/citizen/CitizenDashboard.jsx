import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaClipboardList, FaClock, FaCheckCircle, FaCopy, FaPlusCircle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { http } from '../../api/http';
import StatsCard from '../../components/ui/StatsCard';

const STATUS_BADGE = {
  pending: 'bg-amber-100 text-amber-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  active: 'bg-blue-100 text-blue-700',
  duplicate: 'bg-slate-100 text-slate-600',
};

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, duplicate: 0 });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    // Fetch all complaints for accurate stats
    http.get('/citizen/complaints').then(({ data }) => {
      const complaints = data?.data?.complaints ?? data?.complaints ?? [];
      const total = complaints.length;
      const pending = complaints.filter((c) => c.status === 'pending').length;
      const resolved = complaints.filter((c) => c.status === 'resolved').length;
      const duplicate = complaints.filter((c) => c.isDuplicate).length;
      setStats({ total, pending, resolved, duplicate });
      setRecent(complaints.slice(0, 5));
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-slateink-900">
            Welcome back, {user?.name?.split(' ')[0] || 'Citizen'} 👋
          </h2>
          <p className="mt-1 text-sm text-slate-500">Here's an overview of your civic complaints.</p>
        </div>
        <Link
          to="/citizen/report"
          className="inline-flex items-center gap-2 rounded-xl bg-civic-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-civic-700 transition-colors"
        >
          <FaPlusCircle />
          Report New Issue
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Total Complaints" value={stats.total} icon={<FaClipboardList />} color="blue" />
        <StatsCard title="Pending" value={stats.pending} icon={<FaClock />} color="yellow" />
        <StatsCard title="Resolved" value={stats.resolved} icon={<FaCheckCircle />} color="green" />
        <StatsCard title="Duplicate Linked" value={stats.duplicate} icon={<FaCopy />} color="purple" />
      </div>

      {/* Recent Complaints */}
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-slateink-900">Recent Complaints</h3>
          <Link to="/citizen/complaints" className="text-sm text-civic-600 hover:underline">
            View all
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No complaints filed yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((c) => (
              <li key={c._id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slateink-900">{c.title || c.description?.slice(0, 60) || 'Untitled'}</p>
                  <p className="text-xs text-slate-400">{c.category} · {new Date(c.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[c.status] || 'bg-slate-100 text-slate-600'}`}>
                  {c.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
