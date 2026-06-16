import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTag, FaLink, FaEye, FaPen, 
  FaCheckCircle, FaExclamationCircle, FaArrowLeft
} from 'react-icons/fa';
import { createThread } from '../../api/communityApi';
import { useTheme } from '../../context/ThemeContext';

const CATEGORIES = [
  'Roads', 'Water', 'Sanitation', 'Electricity', 
  'Drainage', 'General', 'Emergency', 'Suggestion'
];

export default function CreateThread() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    category: 'General',
    area: '',
    tags: [],
    relatedComplaint: ''
  });

  const [errors, setErrors] = useState({});
  const [currentTag, setCurrentTag] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 150) {
      newErrors.title = 'Title must be less than 150 characters';
    }

    if (!formData.body.trim()) {
      newErrors.body = 'Discussion body is required';
    } else if (formData.body.length > 2000) {
      newErrors.body = 'Body must be less than 2000 characters';
    }

    if (formData.relatedComplaint && !/^CMP-\d{4}-\d{4}$/.test(formData.relatedComplaint)) {
      newErrors.relatedComplaint = 'Invalid format. Expected: CMP-YYYY-XXXX';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      if (formData.tags.length < 5 && !formData.tags.includes(currentTag.trim())) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, currentTag.trim()] }));
      }
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      // Ensure empty string is sent as null to prevent ObjectId casting errors
      const payload = {
        ...formData,
        relatedComplaint: formData.relatedComplaint.trim() || null
      };
      
      const res = await createThread(payload);
      navigate(`/community/${res.data._id}`);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to create thread. Please check your inputs.';
      setErrors({ submit: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 py-12 px-4 sm:px-6 lg:px-8 relative overflow-x-hidden ${
      theme === 'dark' ? 'bg-[#020617] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] ${
          theme === 'dark' ? 'bg-blue-600/10' : 'bg-blue-400/5'
        }`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] ${
          theme === 'dark' ? 'bg-cyan-600/10' : 'bg-cyan-400/5'
        }`} />
      </div>

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
          : 'bg-white border-blue-100 text-blue-600 hover:bg-blue-50 shadow-blue-500/5'
        }`}
      >
        <FaArrowLeft className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} />
        <span className="hidden sm:inline">Back</span>
      </motion.button>

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter">
              <span className={`text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 ${
                theme === 'dark' ? 'drop-shadow-[0_0_25px_rgba(59,130,246,0.5)]' : ''
              }`}>
                Create New Thread
              </span>
            </h1>
            <p className={`text-lg md:text-xl max-w-2xl mx-auto font-medium ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Contribute to your community by starting a discussion or linking a civic concern.
            </p>
          </motion.div>
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-[3rem] border shadow-2xl overflow-hidden backdrop-blur-3xl transition-all duration-500 ${
            theme === 'dark' ? 'bg-slate-900/40 border-white/10' : 'bg-white border-blue-50'
          }`}
        >
          {/* Card Header */}
          <div className={`flex justify-between items-center px-8 md:px-12 py-8 border-b ${
            theme === 'dark' ? 'border-white/5 bg-white/[0.02]' : 'border-blue-50 bg-blue-50/30'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500/30" />
              <div className="w-3 h-3 rounded-full bg-amber-500/30" />
              <div className="w-3 h-3 rounded-full bg-green-500/30" />
            </div>
            <button 
              type="button"
              onClick={() => setIsPreview(!isPreview)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all font-bold text-xs uppercase tracking-widest border ${
                isPreview 
                ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                : theme === 'dark'
                  ? 'bg-white/5 border-white/10 text-blue-400 hover:bg-white/10'
                  : 'bg-white border-blue-100 text-blue-600 hover:bg-blue-50'
              }`}
            >
              {isPreview ? <><FaPen size={10} /> Edit Mode</> : <><FaEye size={10} /> Preview Post</>}
            </button>
          </div>

          <div className="p-8 md:p-12">
            <AnimatePresence mode="wait">
              {isPreview ? (
                /* PREVIEW */
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className={`pb-8 border-b ${theme === 'dark' ? 'border-white/10' : 'border-blue-50'}`}>
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-500 border border-blue-500/20 mb-6">
                      {formData.category}
                    </span>
                    <h2 className={`text-3xl md:text-4xl font-black leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      {formData.title || <span className="opacity-20 italic">Untitled Discussion</span>}
                    </h2>
                  </div>
                  
                  <div className="min-h-[250px]">
                    <p className={`text-lg leading-relaxed whitespace-pre-wrap ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                      {formData.body || <span className="opacity-20 italic">Content preview...</span>}
                    </p>
                  </div>

                  {(formData.area || formData.relatedComplaint) && (
                    <div className="flex flex-wrap gap-4 pt-8 border-t border-white/5">
                      {formData.area && (
                        <div className={`px-4 py-2 rounded-xl text-xs font-bold ${theme === 'dark' ? 'bg-white/5 text-slate-400' : 'bg-slate-50 text-slate-600'}`}>
                          📍 {formData.area}
                        </div>
                      )}
                      {formData.relatedComplaint && (
                        <div className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                          <FaLink className="inline mr-2" /> {formData.relatedComplaint}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ) : (
                /* FORM */
                <motion.form
                  key="form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleSubmit}
                  className="space-y-10"
                >
                  {/* Title */}
                  <div className="group">
                    <label className={`block text-[10px] font-black uppercase tracking-[0.3em] mb-4 ml-1 ${
                      theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      Discussion Title <span className="text-blue-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleChange}
                      maxLength={150}
                      placeholder="What is on your mind?"
                      className={`w-full px-8 py-5 text-lg rounded-2xl border transition-all outline-none ${
                        theme === 'dark'
                        ? 'bg-white/[0.03] border-white/10 text-white placeholder-slate-600 focus:border-blue-500/50'
                        : 'bg-slate-50 border-blue-50 text-slate-800 placeholder-slate-400 focus:border-blue-300 focus:bg-white'
                      }`}
                    />
                    <div className="mt-3 flex justify-between items-center px-2">
                      {errors.title && <span className="text-red-500 text-[10px] font-bold flex items-center gap-1 uppercase tracking-widest"><FaExclamationCircle /> {errors.title}</span>}
                      <span className={`text-[10px] font-black tracking-widest ${formData.title.length > 140 ? 'text-amber-500' : 'text-slate-500'}`}>
                        {formData.title.length} / 150
                      </span>
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-[0.3em] mb-6 ml-1 ${
                      theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      Select Category <span className="text-blue-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {CATEGORIES.map(cat => (
                        <motion.button
                          key={cat}
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                          className={`py-4 rounded-2xl text-xs font-black tracking-widest uppercase transition-all border ${
                            formData.category === cat 
                              ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' 
                              : theme === 'dark'
                                ? 'bg-white/[0.03] border-white/5 text-slate-500 hover:text-slate-300'
                                : 'bg-slate-50 border-blue-50 text-slate-500 hover:text-blue-600 hover:border-blue-200 shadow-sm'
                          }`}
                        >
                          {cat}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Body */}
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-[0.3em] mb-4 ml-1 ${
                      theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      Discussion Content <span className="text-blue-500">*</span>
                    </label>
                    <textarea
                      name="body"
                      required
                      rows={10}
                      value={formData.body}
                      onChange={handleChange}
                      maxLength={2000}
                      placeholder="Share your thoughts, data, or questions with the community..."
                      className={`w-full px-8 py-6 text-lg rounded-[2.5rem] border transition-all outline-none resize-none leading-relaxed ${
                        theme === 'dark'
                        ? 'bg-white/[0.03] border-white/10 text-white placeholder-slate-600 focus:border-blue-500/50'
                        : 'bg-slate-50 border-blue-50 text-slate-800 placeholder-slate-400 focus:border-blue-300 focus:bg-white'
                      }`}
                    />
                    <div className="mt-3 flex justify-between items-center px-2">
                      {errors.body && <span className="text-red-500 text-[10px] font-bold flex items-center gap-1 uppercase tracking-widest"><FaExclamationCircle /> {errors.body}</span>}
                      <span className={`text-[10px] font-black tracking-widest ${formData.body.length > 1900 ? 'text-amber-500' : 'text-slate-500'}`}>
                        {formData.body.length} / 2000
                      </span>
                    </div>
                  </div>

                  {/* Optional row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    <div className="space-y-4">
                      <label className={`block text-[10px] font-black uppercase tracking-[0.3em] ml-1 ${
                        theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        Area / Neighborhood <span className="opacity-50 normal-case tracking-normal font-bold">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        name="area"
                        value={formData.area}
                        onChange={handleChange}
                        placeholder="e.g. Skyline Heights"
                        className={`w-full px-6 py-4 rounded-xl border transition-all outline-none font-bold text-sm ${
                          theme === 'dark'
                          ? 'bg-white/[0.03] border-white/10 text-white placeholder-slate-700 focus:border-blue-500/40'
                          : 'bg-slate-50 border-blue-50 text-slate-800 placeholder-slate-300 focus:border-blue-200'
                        }`}
                      />
                    </div>
                    <div className="space-y-4">
                      <label className={`block text-[10px] font-black uppercase tracking-[0.3em] ml-1 ${
                        theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        Link Complaint <span className="opacity-50 normal-case tracking-normal font-bold">(Optional)</span>
                      </label>
                      <div className="relative">
                        <FaLink className="absolute left-6 top-1/2 -translate-y-1/2 opacity-30" size={12} />
                        <input
                          type="text"
                          name="relatedComplaint"
                          value={formData.relatedComplaint}
                          onChange={handleChange}
                          placeholder="CMP-2024-XXXX"
                          className={`w-full pl-12 pr-6 py-4 rounded-xl border transition-all outline-none font-bold text-sm ${
                            theme === 'dark'
                            ? 'bg-white/[0.03] border-white/10 text-white placeholder-slate-700 focus:border-blue-500/40'
                            : 'bg-slate-50 border-blue-50 text-slate-800 placeholder-slate-300 focus:border-blue-200'
                          } ${errors.relatedComplaint ? 'border-red-500/50 focus:border-red-500/70' : ''}`}
                        />
                      </div>
                      {errors.relatedComplaint && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest px-1">{errors.relatedComplaint}</p>}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-10">
                    {errors.submit && (
                      <div className="mb-6 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold text-center tracking-widest uppercase flex items-center justify-center gap-3">
                        <FaExclamationCircle className="shrink-0" /> 
                        <span>{errors.submit}</span>
                      </div>
                    )}
                    
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: 1.01, boxShadow: theme === 'dark' ? "0 0 40px rgba(59, 130, 246, 0.3)" : "0 10px 30px rgba(59, 130, 246, 0.2)" }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full relative overflow-hidden bg-blue-600 py-6 rounded-[2.5rem] text-xl font-black text-white shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                      {loading ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                          Publishing Discussion...
                        </div>
                      ) : (
                        <span className="flex items-center justify-center gap-3 tracking-widest uppercase">
                          <FaCheckCircle className="text-blue-300" />
                          Post to Community
                        </span>
                      )}
                    </motion.button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
