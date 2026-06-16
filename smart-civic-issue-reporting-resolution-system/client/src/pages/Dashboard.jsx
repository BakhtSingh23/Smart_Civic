export { default } from './citizen/CitizenDashboard.jsx';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Loader from '../components/Loader.jsx';
import { http } from '../api/http';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await http.get('/admin/stats');
        if (mounted) setStats(data);
      } catch (err) {
        toast.info('Login as admin/authority to view stats');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <Loader label="Loading dashboard…" />;

  return (
    <div className="card app-card">
      <div className="card-body">
        <h4 className="mb-3">Statistics</h4>
        {!stats ? (
          <p className="text-muted mb-0">No stats available for current user.</p>
        ) : (
          <>
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <div className="p-3 rounded bg-light">
                  <div className="small text-muted">Recurrence</div>
                  <div className="fs-4 fw-semibold">{stats.recurrenceCount}</div>
                </div>
              </div>
              <div className="col-12 col-md-8">
                <div className="p-3 rounded bg-light">
                  <div className="small text-muted mb-2">By status</div>
                  <div className="d-flex flex-wrap gap-2">
                    {stats.byStatus.map((s) => (
                      <span key={s._id} className="badge text-bg-primary">
                        {s._id}: {s.count}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
