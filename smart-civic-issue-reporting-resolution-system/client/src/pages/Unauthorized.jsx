import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="max-w-xl rounded-3xl bg-white p-10 text-center shadow-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-civic-500">Access denied</p>
        <h1 className="mt-4 font-display text-3xl font-semibold text-slateink-900">
          You do not have permission to view this page.
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          Please return to a dashboard that matches your role or login again.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link className="rounded-full bg-civic-500 px-5 py-2 text-sm font-semibold text-white" to="/">
            Back to home
          </Link>
          <Link className="rounded-full border border-civic-200 px-5 py-2 text-sm font-semibold text-civic-600" to="/login">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
