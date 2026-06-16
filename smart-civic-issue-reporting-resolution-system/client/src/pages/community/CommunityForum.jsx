import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaPlus, FaSearch, FaRegComments, FaRegEye, 
  FaArrowUp, FaArrowLeft
} from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { getThreads } from '../../api/communityApi';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/community.css';

const categories = ['All', 'Roads', 'Water', 'Sanitation', 'Electricity', 'Drainage', 'General', 'Emergency', 'Suggestion'];

export default function CommunityForum() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ total: 0 });

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchThreads();
  }, [category, sort, page]);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const res = await getThreads({ category, sort, page, search });
      setThreads(res.data.threads);
      setTotalPages(res.data.totalPages);
      setStats({ total: res.data.total });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchThreads();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  return (
    <div className={`min-h-screen transition-colors duration-500 py-12 ${
      theme === 'dark' ? 'bg-[#020617] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Centralized Container for Alignment */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Button - Aligned with container */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/citizen/dashboard')}
          className={`mb-8 flex items-center gap-2 px-5 py-2.5 rounded-xl backdrop-blur-xl border transition-all shadow-lg font-bold ${
            theme === 'dark' 
            ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' 
            : 'bg-white border-blue-100 text-blue-600 hover:bg-blue-50 shadow-blue-500/5'
          }`}
        >
          <FaArrowLeft className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} />
          <span className="text-sm tracking-wide">Back</span>
        </motion.button>

        {/* Header/Hero Section - Flex Container */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12 relative">
          <div className="flex-1">
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-black mb-4 tracking-tight"
            >
              <span className={`text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 ${
                theme === 'dark' ? 'drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]' : ''
              }`}>
                🏘️ Community Forum
              </span>
            </motion.h1>
            <p className={`text-lg font-medium max-w-2xl ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Connect with your community, discuss local civic issues, and share important updates.
            </p>
            
            <div className="flex gap-4 mt-6">
              <div className={`px-4 py-2 rounded-2xl border backdrop-blur-md flex items-center gap-2 ${
                theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-blue-50 shadow-sm'
              }`}>
                <span className="text-blue-500 font-black">{stats.total}</span> 
                <span className={`text-[10px] uppercase font-black tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Threads</span>
              </div>
              <div className={`px-4 py-2 rounded-2xl border backdrop-blur-md flex items-center gap-2 ${
                theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-blue-50 shadow-sm'
              }`}>
                <span className="text-cyan-500 font-black">{threads.length}</span> 
                <span className={`text-[10px] uppercase font-black tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Showing</span>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <motion.button 
              whileHover={{ scale: 1.02, boxShadow: theme === 'dark' ? "0 0 25px rgba(59, 130, 246, 0.4)" : "0 10px 15px -3px rgba(59, 130, 246, 0.2)" }}
              whileTap={{ scale: 0.98 }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl transition-all tracking-widest text-xs uppercase"
              onClick={() => user ? navigate('/community/new') : navigate('/login')}
            >
              <FaPlus /> NEW DISCUSSION
            </motion.button>
          </div>
        </header>

        {/* Search & Filters Section */}
        <div className="space-y-8 mb-12">
          {/* Search Bar - Width Aligned */}
          <div className="group">
            <div className={`relative rounded-2xl border transition-all duration-300 ${
              theme === 'dark' 
              ? 'bg-white/[0.03] border-white/10 focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/10' 
              : 'bg-white border-blue-100 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/5 shadow-sm'
            }`}>
              <FaSearch className={`absolute left-6 top-1/2 -translate-y-1/2 transition-colors ${
                theme === 'dark' ? 'text-slate-600 group-focus-within:text-blue-400' : 'text-slate-400 group-focus-within:text-blue-500'
              }`} />
              <input 
                type="text" 
                placeholder="Search discussions by title or keywords..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent border-none rounded-2xl px-14 py-4.5 text-inherit placeholder-slate-500 focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* Category Pills - Wrapping properly */}
          <div className="flex flex-wrap items-center gap-3">
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] mr-2 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>Filter:</span>
            {categories.map(cat => (
              <motion.button 
                key={cat} 
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all border ${
                  category === cat 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' 
                  : theme === 'dark'
                    ? 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/20'
                    : 'bg-white border-blue-50 text-slate-500 hover:text-blue-600 hover:border-blue-200 shadow-sm'
                }`}
                onClick={() => { setCategory(cat); setPage(1); }}
              >
                {cat}
              </motion.button>
            ))}
          </div>

          {/* Sort Tabs */}
          <div className={`flex gap-10 border-b ${theme === 'dark' ? 'border-white/5' : 'border-blue-100'}`}>
            {[
              { id: 'newest', label: '🕐 Newest' },
              { id: 'top', label: '🔥 Top' },
              { id: 'active', label: '💬 Active' }
            ].map(s => (
              <button 
                key={s.id}
                className={`pb-4 px-2 text-[10px] font-black tracking-[0.3em] uppercase transition-all relative ${
                  sort === s.id 
                    ? (theme === 'dark' ? 'text-blue-400' : 'text-blue-600') 
                    : (theme === 'dark' ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-blue-400')
                }`}
                onClick={() => setSort(s.id)}
              >
                {s.label}
                {sort === s.id && (
                  <motion.div 
                    layoutId="sortUnderline" 
                    className={`absolute bottom-0 left-0 w-full h-1 rounded-t-full shadow-lg ${
                      theme === 'dark' ? 'bg-blue-500' : 'bg-blue-600'
                    }`} 
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-8 pb-20">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <div className={`w-12 h-12 border-4 rounded-full animate-spin border-t-blue-500 ${
                theme === 'dark' ? 'border-blue-500/10' : 'border-blue-100'
              }`} />
              <p className={`font-black tracking-widest text-[10px] uppercase animate-pulse ${
                theme === 'dark' ? 'text-slate-600' : 'text-slate-400'
              }`}>Updating content...</p>
            </div>
          ) : threads.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-[3rem] p-16 md:p-24 text-center border flex flex-col items-center ${
                theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-white border-blue-50 shadow-xl shadow-blue-500/5'
              }`}
            >
              <div className="text-7xl mb-8 opacity-20">💭</div>
              <h3 className={`text-2xl font-black mb-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>No discussions found</h3>
              <p className={`mb-10 max-w-sm mx-auto font-medium text-lg leading-relaxed ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                Start the first conversation in this category and engage with your fellow citizens.
              </p>
              <button 
                className={`px-10 py-4 rounded-2xl font-black transition-all border tracking-widest text-[10px] uppercase ${
                  theme === 'dark' 
                  ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' 
                  : 'bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100'
                }`}
                onClick={() => user ? navigate('/community/new') : navigate('/login')}
              >
                CREATE NEW THREAD
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {threads.map((thread, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  key={thread._id}
                >
                  <ThreadCard thread={thread} navigate={navigate} theme={theme} />
                </motion.div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-8 pt-12">
              <button 
                className={`p-4 rounded-2xl transition-all border ${
                  theme === 'dark' 
                  ? 'bg-white/5 border-white/10 text-white disabled:opacity-20 hover:bg-white/10' 
                  : 'bg-white border-blue-100 text-blue-600 disabled:opacity-30 hover:bg-blue-50 shadow-sm'
                }`}
                disabled={page === 1} 
                onClick={() => setPage(page - 1)}
              >
                <FaArrowLeft />
              </button>
              <div className="flex flex-col items-center">
                <span className={`text-[10px] font-black tracking-[0.3em] uppercase ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-1.5 mt-3">
                  {[...Array(totalPages)].map((_, i) => (
                    <div key={i} className={`h-1 rounded-full transition-all duration-300 ${
                      page === i + 1 ? 'w-8 bg-blue-500' : 'w-2 bg-slate-400/20'
                    }`} />
                  ))}
                </div>
              </div>
              <button 
                className={`p-4 rounded-2xl transition-all border ${
                  theme === 'dark' 
                  ? 'bg-white/5 border-white/10 text-white disabled:opacity-20 hover:bg-white/10' 
                  : 'bg-white border-blue-100 text-blue-600 disabled:opacity-30 hover:bg-blue-50 shadow-sm'
                }`}
                disabled={page === totalPages} 
                onClick={() => setPage(page + 1)}
              >
                <FaArrowLeft className="rotate-180" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ThreadCard({ thread, navigate, theme }) {
  return (
    <motion.div 
      whileHover={{ y: -6 }}
      className={`relative group rounded-[2.5rem] p-8 md:p-10 transition-all duration-500 cursor-pointer border ${
        theme === 'dark' 
          ? 'bg-slate-900/40 backdrop-blur-2xl border-white/10 hover:bg-slate-900/60' 
          : 'bg-white border-blue-100 shadow-xl shadow-blue-900/5 hover:border-blue-200'
      } ${thread.isPinned ? (theme === 'dark' ? 'border-amber-500/30 ring-1 ring-amber-500/10' : 'border-amber-100 ring-4 ring-amber-50') : ''}`}
      onClick={() => navigate(`/community/${thread._id}`)}
    >
      {thread.isPinned && (
        <div className="absolute top-0 right-12 translate-y-[-50%] bg-amber-500 text-amber-950 text-[10px] font-black px-5 py-1.5 rounded-full shadow-lg tracking-widest uppercase">
          PINNED
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase border ${
          thread.category === 'Emergency' 
            ? 'bg-red-500/10 text-red-500 border-red-500/20' 
            : (theme === 'dark' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-100')
        }`}>
          {thread.category}
        </span>
        {thread.status === 'resolved' && (
          <span className="px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase bg-green-500/10 text-green-400 border border-green-500/20">
            Resolved
          </span>
        )}
      </div>

      <h3 className={`text-2xl md:text-3xl font-black mb-4 transition-colors group-hover:text-blue-500 tracking-tight leading-tight ${
        theme === 'dark' ? 'text-white' : 'text-slate-800'
      }`}>
        {thread.title}
      </h3>
      
      <p className={`line-clamp-2 mb-10 text-lg font-medium leading-relaxed ${
        theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
      }`}>
        {thread.body}
      </p>

      {thread.tags?.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-10">
          {thread.tags.map(tag => (
            <span key={tag} className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl ${
              theme === 'dark' ? 'bg-white/5 text-slate-500' : 'bg-slate-50 text-slate-400 border border-slate-100'
            }`}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8 pt-8 border-t ${
        theme === 'dark' ? 'border-white/5' : 'border-blue-50'
      }`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-black shadow-lg">
            {thread.author.name.charAt(0)}
          </div>
          <div>
            <div className={`text-base font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              {thread.author.name}
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                {formatDistanceToNow(new Date(thread.createdAt))} ago
              </span>
              {thread.author.role !== 'citizen' && (
                <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${
                  thread.author.role === 'admin' 
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                }`}>
                  {thread.author.role}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-8">
          <div className="flex items-center gap-2.5">
            <FaRegEye className="text-blue-500/40" />
            <span className={`text-xs font-black ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{thread.views}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <FaRegComments className="text-cyan-500/40" />
            <span className={`text-xs font-black ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{thread.replyCount}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <FaArrowUp className="text-indigo-500/40" />
            <span className={`text-xs font-black ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{thread.upvoteCount}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
