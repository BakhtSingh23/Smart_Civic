import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="px-6 py-10">
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="font-display text-3xl font-semibold text-slateink-900">Smart City Issue Reporting</h1>
        <p className="mt-3 text-sm text-slate-600">
          Report civic issues, route them to departments, assign workers, and notify citizens when work is completed.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link
            to="/register"
            className="inline-flex items-center justify-center rounded-xl bg-civic-500 px-5 py-2.5 font-semibold text-white transition hover:bg-civic-600"
          >
            Create citizen account
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 font-semibold text-slateink-900 transition hover:bg-slate-50"
          >
            Sign in
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
