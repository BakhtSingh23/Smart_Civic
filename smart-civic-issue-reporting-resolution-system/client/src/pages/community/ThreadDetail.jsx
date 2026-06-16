import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaArrowUp, FaReply, FaTrash, FaCheckCircle, 
  FaShareAlt, FaThumbtack, FaLock, FaInfoCircle, FaArrowLeft
} from 'react-icons/fa';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  getThread, getThreadReplies, replyToThread, 
  upvoteThread, upvoteReply, deleteReply, 
  pinThread, lockThread, markThreadResolved, deleteThread 
} from '../../api/communityApi';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/community.css';

export default function ThreadDetail() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [thread, setThread] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const replyInputRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchThreadData();
  }, [threadId]);

  const fetchThreadData = async () => {
    try {
      setLoading(true);
      const [threadRes, repliesRes] = await Promise.all([
        getThread(threadId),
        getThreadReplies(threadId)
      ]);
      setThread(threadRes.data);
      setReplies(repliesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvoteThread = async () => {
    if (!user) return navigate('/login');
    try {
      const res = await upvoteThread(threadId);
      setThread({ 
        ...thread, 
        upvoteCount: res.data.newCount, 
        upvotes: res.data.upvoted 
          ? [...thread.upvotes, user._id] 
          : thread.upvotes.filter(id => id !== user._id) 
      });
    } catch (err) { console.error(err); }
  };

  const handleReply = async (e) => {
    if (e) e.preventDefault();
    if (!user) return navigate('/login');
    if (!replyBody.trim()) return;

    try {
      setIsSubmitting(true);
      await replyToThread(threadId, { body: replyBody, parentReply: replyingTo });
      setReplyBody('');
      setReplyingTo(null);
      const res = await getThreadReplies(threadId);
      setReplies(res.data);
      setThread({ ...thread, replyCount: thread.replyCount + 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAction = async (actionFn, ...args) => {
    try {
      await actionFn(...args);
      fetchThreadData();
    } catch (err) { console.error(err); }
  };

  const handleInitiateReply = (id) => {
    setReplyingTo(id);
    replyInputRef.current?.scrollIntoView({ behavior: 'smooth' });
    replyInputRef.current?.focus();
  };

  if (loading) return (
    <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${theme === 'dark' ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-800'}`}>
      <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      <p className="font-black tracking-widest uppercase text-xs opacity-50">Syncing discussion data...</p>
    </div>
  );

  if (!thread) return (
    <div className={`min-h-screen flex flex-col items-center justify-center gap-6 ${theme === 'dark' ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-800'}`}>
      <div className="text-6xl">⚠️</div>
      <h2 className="text-3xl font-black">Thread not found</h2>
      <button onClick={() => navigate('/community')} className="px-8 py-3 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest text-xs">Return to Forum</button>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-500 py-12 px-4 sm:px-6 lg:px-8 relative ${
      theme === 'dark' ? 'bg-[#020617] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/community')}
        className={`fixed top-8 left-4 md:left-8 z-50 flex items-center gap-2 px-5 py-2.5 rounded-xl backdrop-blur-xl border font-bold shadow-2xl transition-all ${
          theme === 'dark' 
          ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' 
          : 'bg-white border-blue-100 text-blue-600 hover:bg-blue-50'
        }`}
      >
        <FaArrowLeft className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} />
        <span className="hidden sm:inline">Back</span>
      </motion.button>

      <div className="max-w-4xl mx-auto pt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-[3rem] p-8 md:p-12 border shadow-2xl overflow-hidden backdrop-blur-3xl transition-all duration-500 mb-10 ${
            theme === 'dark' ? 'bg-slate-900/40 border-white/10' : 'bg-white border-blue-50 shadow-blue-900/5'
          }`}
        >
          <div className="flex flex-wrap gap-2 mb-8">
            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase border ${
              theme === 'dark' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-100'
            }`}>
              {thread.category}
            </span>
            {thread.status === 'resolved' && (
              <span className="px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase bg-green-500/10 text-green-500 border border-green-500/20">
                Resolved
              </span>
            )}
            {thread.isPinned && (
              <span className="px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
                Pinned
              </span>
            )}
          </div>

          <h1 className={`text-4xl md:text-5xl font-black mb-8 leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
            {thread.title}
          </h1>

          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-black text-xl shadow-lg">
              {thread.author.name.charAt(0)}
            </div>
            <div>
              <div className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                {thread.author.name}
                {thread.author.role !== 'citizen' && (
                  <span className={`ml-3 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${
                    thread.author.role === 'admin' 
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {thread.author.role}
                  </span>
                )}
              </div>
              <div className={`text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                Posted {formatDistanceToNow(new Date(thread.createdAt))} ago • {format(new Date(thread.createdAt), 'PPP')}
              </div>
            </div>
          </div>

          <div className={`text-xl leading-relaxed whitespace-pre-wrap mb-12 font-medium ${
            theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
          }`}>
            {thread.body}
          </div>

          {thread.relatedComplaint && (
            <div className={`flex items-center gap-4 p-6 rounded-3xl border mb-12 ${
              theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-blue-50/50 border-blue-100'
            }`}>
              <FaInfoCircle className="text-blue-500 shrink-0" size={24} />
              <div className="text-sm font-bold">
                <span className={theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}>Linked to Complaint: </span>
                <span className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}>{thread.relatedComplaint.title}</span>
                <span className="ml-3 px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-[10px] uppercase tracking-widest">{thread.relatedComplaint.status}</span>
              </div>
            </div>
          )}

          <div className={`flex flex-wrap gap-4 pt-10 border-t ${theme === 'dark' ? 'border-white/5' : 'border-blue-50'}`}>
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={handleUpvoteThread}
              className={`flex items-center gap-3 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border ${
                thread.upvotes.includes(user?._id)
                ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                : theme === 'dark'
                  ? 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  : 'bg-white border-blue-100 text-blue-600 hover:bg-blue-50'
              }`}
            >
              <FaArrowUp /> {thread.upvoteCount} Upvotes
            </motion.button>
            
            <button 
              onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Link copied!'); }}
              className={`flex items-center gap-3 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border ${
                theme === 'dark'
                ? 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                : 'bg-white border-blue-100 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <FaShareAlt /> Share
            </button>

            {user && user.role === 'admin' && (
              <div className="flex gap-2">
                <button 
                  onClick={() => handleAction(pinThread, thread._id)}
                  className={`p-3 rounded-xl border transition-all ${
                    thread.isPinned 
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-500' 
                    : 'bg-white/5 border-white/10 text-slate-500'
                  }`}
                >
                  <FaThumbtack />
                </button>
                <button 
                  onClick={() => handleAction(lockThread, thread._id)}
                  className={`p-3 rounded-xl border transition-all ${
                    thread.isLocked 
                    ? 'bg-red-500/20 border-red-500/40 text-red-500' 
                    : 'bg-white/5 border-white/10 text-slate-500'
                  }`}
                >
                  <FaLock />
                </button>
                <button 
                  onClick={() => { if(window.confirm('Delete this thread?')) { handleAction(deleteThread, thread._id); navigate('/community'); } }}
                  className="p-3 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all"
                >
                  <FaTrash />
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Alerts */}
        {thread.isLocked && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-6 rounded-3xl mb-8 flex items-center gap-4 font-bold text-sm">
            <FaLock /> Discussion is locked by administrators. No new replies can be posted.
          </div>
        )}
        {thread.status === 'resolved' && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-6 rounded-3xl mb-8 flex items-center gap-4 font-bold text-sm">
            <FaCheckCircle /> This civic issue has been officially marked as resolved.
          </div>
        )}

        {/* Replies Section */}
        <div className="reply-section">
          <h3 className={`text-2xl font-black mb-10 uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
            💬 {thread.replyCount} Replies
          </h3>

          {user && !thread.isLocked ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-[2.5rem] p-8 border mb-16 shadow-xl ${
                theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-blue-50'
              }`}
            >
              {replyingTo && (
                <div className="mb-4 flex justify-between items-center bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Replying to nested comment</span>
                  <button onClick={() => setReplyingTo(null)} className="text-red-500 font-black text-[10px] uppercase">Cancel</button>
                </div>
              )}
              <textarea 
                ref={replyInputRef}
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                maxLength={1000}
                placeholder="Share your thoughts, suggestions, or insights..."
                className={`w-full min-h-[150px] bg-transparent border-none outline-none text-lg leading-relaxed placeholder-slate-600 resize-none ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}
              />
              <div className="flex justify-between items-center pt-6 border-t border-white/5 mt-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{replyBody.length} / 1000</span>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSubmitting || !replyBody.trim()}
                  onClick={handleReply}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-30"
                >
                  {isSubmitting ? 'Posting...' : 'Post Reply'}
                </motion.button>
              </div>
            </motion.div>
          ) : !user ? (
            <div className={`p-12 rounded-[2.5rem] border text-center mb-16 ${
              theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-blue-50'
            }`}>
              <p className="text-slate-500 font-bold mb-6 italic">Please login to join the discussion.</p>
              <Link to="/login" className="px-10 py-3 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest shadow-lg inline-block">Login Now</Link>
            </div>
          ) : null}

          <div className="space-y-10">
            {replies.length === 0 ? (
              <div className="py-20 text-center text-slate-600 font-bold italic opacity-30">No replies yet. Be the first to join the conversation!</div>
            ) : (
              replies.map(reply => (
                <ReplyCard 
                  key={reply._id} 
                  reply={reply} 
                  user={user} 
                  threadId={threadId}
                  onRefresh={fetchThreadData}
                  onReply={handleInitiateReply}
                  theme={theme}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReplyCard({ reply, user, threadId, onRefresh, onReply, theme }) {
  const isAuthor = user && user._id === reply.author._id;
  const isAdmin = user && user.role === 'admin';

  const handleUpvote = async () => {
    if (!user) return;
    try {
      await upvoteReply(reply._id);
      onRefresh();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this reply?')) {
      try {
        await deleteReply(reply._id);
        onRefresh();
      } catch (err) { console.error(err); }
    }
  };

  return (
    <div className={`relative transition-all duration-300 ${reply.isOfficialResponse ? 'z-10' : ''}`}>
      <div className={`rounded-[2rem] p-8 border ${
        reply.isOfficialResponse 
        ? (theme === 'dark' ? 'bg-blue-600/10 border-blue-500/30' : 'bg-blue-50 border-blue-200')
        : (theme === 'dark' ? 'bg-white/[0.03] border-white/5' : 'bg-white border-blue-50 shadow-sm')
      } ${reply.isDeleted ? 'opacity-40 grayscale' : ''}`}>
        
        {reply.isOfficialResponse && (
          <div className="flex items-center gap-2 bg-blue-600 text-white text-[10px] font-black px-4 py-1 rounded-full w-fit mb-6 shadow-lg tracking-widest uppercase">
            <FaCheckCircle size={10} /> Official Municipal Response
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-black shadow-md">
              {reply.author.name.charAt(0)}
            </div>
            <div>
              <div className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                {reply.author.name}
                {reply.author.role !== 'citizen' && (
                  <span className={`ml-2 text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter ${
                    reply.author.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {reply.author.role}
                  </span>
                )}
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {formatDistanceToNow(new Date(reply.createdAt))} ago
              </div>
            </div>
          </div>
        </div>

        <div className={`text-lg leading-relaxed mb-8 font-medium ${
          theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
        }`}>
          {reply.body}
        </div>

        {!reply.isDeleted && (
          <div className="flex gap-6 pt-6 border-t border-white/5">
            <button 
              onClick={handleUpvote}
              className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${
                reply.upvotes.includes(user?._id) ? 'text-blue-500' : 'text-slate-500 hover:text-blue-400'
              }`}
            >
              <FaArrowUp /> {reply.upvoteCount}
            </button>
            <button 
              onClick={() => onReply(reply._id)}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-blue-400 transition-all"
            >
              <FaReply /> Reply
            </button>
            {(isAuthor || isAdmin) && (
              <button 
                onClick={handleDelete}
                className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-500/50 hover:text-red-500 transition-all ml-auto"
              >
                <FaTrash /> Delete
              </button>
            )}
          </div>
        )}
      </div>

      {reply.children && reply.children.length > 0 && (
        <div className="mt-8 ml-6 md:ml-12 border-l-2 border-white/5 pl-6 md:pl-12 space-y-8">
          {reply.children.map(child => (
            <ReplyCard 
              key={child._id} 
              reply={child} 
              user={user} 
              threadId={threadId} 
              onRefresh={onRefresh}
              onReply={onReply}
              theme={theme}
            />
          ))}
        </div>
      )}
    </div>
  );
}
