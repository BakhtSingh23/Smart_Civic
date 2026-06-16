import React, { useState, useEffect } from 'react';
import { 
  FaThumbtack, FaLock, FaTrash, FaCheckCircle, FaSearch, 
  FaEye, FaCommentAlt, FaArrowUp, FaChevronRight, FaUnlock
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { getThreads, pinThread, lockThread, deleteThread } from '../../api/communityApi';
import { useToast } from '../../context/ToastContext';

export default function CommunityManagement() {
  const { addToast } = useToast();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchThreads();
  }, [filter]);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const res = await getThreads({ page: 1, limit: 100 });
      let filtered = res.data.threads;
      if (filter === 'locked') filtered = filtered.filter(t => t.isLocked);
      if (filter === 'pinned') filtered = filtered.filter(t => t.isPinned);
      setThreads(filtered);
    } catch (err) { 
      console.error(err);
      addToast('Failed to fetch threads', 'error');
    }
    finally { setLoading(false); }
  };

  const handleAction = async (actionFn, id, actionName) => {
    try {
      await actionFn(id);
      addToast(`${actionName} successful`, 'success');
      fetchThreads();
    } catch (err) { 
      console.error(err);
      addToast(`Failed to ${actionName.toLowerCase()}`, 'error');
    }
  };

  const displayedThreads = threads.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.threadId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="font-body text-slate-800 dark:text-slate-200">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center"
      >
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            Community Management
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Oversee forum discussions, pin important updates, or lock problematic threads.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 rounded-xl bg-white dark:bg-slateink-800 p-1 border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-inner">
          {['all', 'pinned', 'locked'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-6 py-2 text-sm font-medium capitalize transition-all duration-200 ${
                filter === f 
                  ? 'bg-civic-600 text-white shadow-glow' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by ID or Title..." 
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slateink-800 py-3 pl-11 pr-4 text-sm transition-focus focus:border-civic-500 focus:outline-none focus:ring-1 focus:ring-civic-500/50 text-slate-900 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slateink-800/50 backdrop-blur-md shadow-xl dark:shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slateink-800 py-4 uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="px-6 py-4 font-semibold">Thread ID</th>
                <th className="px-6 py-4 font-semibold">Title</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Author</th>
                <th className="px-6 py-4 font-semibold text-center">Stats</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-civic-500 border-t-transparent"></div>
                      <p className="text-slate-500 dark:text-slate-400">Loading community discussions...</p>
                    </div>
                  </td>
                </tr>
              ) : displayedThreads.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center text-slate-400 dark:text-slate-500">
                    No threads found matching your criteria.
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode='popLayout'>
                  {displayedThreads.map((thread) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={thread._id} 
                      className="group transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                    >
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-civic-600 dark:text-civic-400">
                        {thread.threadId}
                      </td>
                      <td className="max-w-xs px-6 py-4">
                        <div className="line-clamp-1 font-semibold text-slate-900 dark:text-white group-hover:text-civic-600 dark:group-hover:text-civic-300">
                          {thread.title}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 dark:bg-slateink-700 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                          {thread.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-civic-600/10 dark:bg-civic-600/20 font-bold text-civic-600 dark:text-civic-400 border border-civic-600/20 dark:border-civic-500/30">
                            {thread.author?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white text-xs">{thread.author?.name || 'Anonymous'}</p>
                            <p className="text-[10px] uppercase tracking-tighter text-slate-400 dark:text-slate-500">{thread.author?.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-4 text-slate-500 dark:text-slate-400">
                          <div className="flex flex-col items-center gap-1" title="Views">
                            <FaEye size={12} className="text-civic-600/70 dark:text-civic-400/70" />
                            <span className="text-[10px] font-mono">{thread.views}</span>
                          </div>
                          <div className="flex flex-col items-center gap-1" title="Replies">
                            <FaCommentAlt size={11} className="text-success/70 dark:text-success/70" />
                            <span className="text-[10px] font-mono">{thread.replyCount}</span>
                          </div>
                          <div className="flex flex-col items-center gap-1" title="Upvotes">
                            <FaArrowUp size={11} className="text-amber-600/70 dark:text-accent/70" />
                            <span className="text-[10px] font-mono">{thread.upvoteCount}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {thread.isPinned && (
                            <span className="flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-500 border border-amber-500/20">
                              <FaThumbtack size={8} /> PINNED
                            </span>
                          )}
                          {thread.isLocked ? (
                            <span className="flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-500 border border-rose-500/20">
                              <FaLock size={8} /> LOCKED
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-500 border border-emerald-500/20">
                              <FaCheckCircle size={8} /> ACTIVE
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleAction(pinThread, thread._id, thread.isPinned ? 'Unpin' : 'Pin')}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                              thread.isPinned 
                                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' 
                                : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:bg-amber-500/10 dark:hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-500'
                            }`}
                            title={thread.isPinned ? 'Unpin' : 'Pin'}
                          >
                            <FaThumbtack size={12} />
                          </button>
                          <button 
                            onClick={() => handleAction(lockThread, thread._id, thread.isLocked ? 'Unlock' : 'Lock')}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                              thread.isLocked 
                                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                                : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-500'
                            }`}
                            title={thread.isLocked ? 'Unlock' : 'Lock'}
                          >
                            {thread.isLocked ? <FaUnlock size={12} /> : <FaLock size={12} />}
                          </button>
                          <button 
                            onClick={() => {
                              if(window.confirm('Are you sure you want to permanently delete this thread?')) {
                                handleAction(deleteThread, thread._id, 'Delete');
                              }
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5 text-slate-400 transition-all hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
                            title="Delete Thread"
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
        
        {!loading && displayedThreads.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slateink-800/80 px-6 py-4">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              Showing {displayedThreads.length} discussion threads
            </p>
            <div className="flex gap-2">
              <button disabled className="rounded-lg bg-slate-100 dark:bg-white/5 px-3 py-1 text-xs text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-white/5 cursor-not-allowed">Previous</button>
              <button disabled className="rounded-lg bg-slate-100 dark:bg-white/5 px-3 py-1 text-xs text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-white/5 cursor-not-allowed">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
