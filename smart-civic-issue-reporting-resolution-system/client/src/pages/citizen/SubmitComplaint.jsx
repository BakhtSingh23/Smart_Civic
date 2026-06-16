import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaChevronRight, FaChevronLeft, FaTimes, FaUpload, FaPlay } from 'react-icons/fa';
import { http } from '../../api/http';
import LocationPicker from '../../components/ui/LocationPicker';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { categoryConfig, CategoryBadge, CategoryEmoji } from '../../components/ui/CategoryIcons';
import { useToast } from '../../context/ToastContext';
import { InlineSpinner } from '../../components/ui/Spinner';

const PRIORITY_COLORS = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-rose-100 text-rose-700',
};

const STEPS = [
  { number: 1, title: 'Issue Details' },
  { number: 2, title: 'Location' },
  { number: 3, title: 'Media' },
  { number: 4, title: 'Review' },
];

export default function SubmitComplaint() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [detectLoading, setDetectLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const [location, setLocation] = useState(null);

  const [mediaFiles, setMediaFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const [confirmed, setConfirmed] = useState(false);

  const handleAutoDetect = async () => {
    if (!description || description.length < 10) return;
    setDetectLoading(true);
    try {
      const { data } = await http.post('/chatbot/detect-category', { description });
      setAiSuggestion(data);
      if (data.category && data.category !== 'Other') setCategory(data.category);
    } catch {
      // fail silently
    } finally {
      setDetectLoading(false);
    }
  };

  // Validation
  const isStep1Valid = title && category && description && title.length >= 5;
  const isStep2Valid = location;
  const isStep3Valid = true; // Media is optional

  const handleLocationSelect = (locData) => {
    if (locData && locData.latitude != null && locData.longitude != null) {
      setLocation(locData);
      setCurrentStep(3);
    } else {
      addToast('Please select a valid location', 'error');
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!isStep1Valid) {
        addToast('Please fill all required fields', 'error');
        return;
      }
    }

    if (currentStep === 2) {
      if (!isStep2Valid) {
        addToast('Please select a location', 'error');
        return;
      }
    }

    if (currentStep === 3) {
      if (!isStep3Valid) {
        addToast('Please complete this step', 'error');
        return;
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  // Media upload
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    addFiles(files);
  };

  const addFiles = (files) => {
    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type === 'video/mp4';
      const isSizeOk = file.size <= 50 * 1024 * 1024;

      if (!isImage && !isVideo) {
        addToast(`${file.name} — only images and MP4 videos allowed`, 'error');
        return false;
      }
      if (!isSizeOk) {
        addToast(`${file.name} — max 50MB per file`, 'error');
        return false;
      }
      return true;
    });

    const newFiles = [...mediaFiles, ...validFiles].slice(0, 5);
    setMediaFiles(newFiles);
  };

  const removeFile = (index) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title || !category || !description || !location || !confirmed) {
      addToast('Please fill all required fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('priority', priority);
      formData.append('description', description);
      formData.append('address', location.address);
      formData.append('area', location.area);
      formData.append('city', location.city);
      formData.append('pincode', location.pincode);
      formData.append('latitude', location.latitude);
      formData.append('longitude', location.longitude);

      mediaFiles.forEach((file) => {
        formData.append('media', file);
      });

      const { data } = await http.post('/citizen/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const complaintId = data?.complaint?.complaintId || 'Unknown';
      setSuccessId(complaintId);

      addToast('Complaint submitted successfully!', 'success');

      // Reset form state
      setTitle('');
      setCategory('');
      setPriority('medium');
      setDescription('');
      setLocation(null);
      setMediaFiles([]);
      setConfirmed(false);
      setCurrentStep(1);

      setTimeout(() => {
        navigate('/citizen/complaints');
      }, 2500);
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to submit complaint', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-6 py-12">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold text-slateink-900">Report a Civic Issue</h1>
          <p className="mt-2 text-slate-600">Help us fix your city. Share your complaint with authorities.</p>
        </div>

        {/* Step Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.number} className="flex flex-col items-center flex-1">
                <div className="flex items-center gap-3 w-full">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full font-semibold transition-all shrink-0 ${
                      currentStep === step.number
                        ? 'bg-civic-600 text-white shadow-lg scale-110'
                        : currentStep > step.number
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {currentStep > step.number ? <FaCheckCircle className="text-lg" /> : step.number}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`h-1 flex-1 transition-all ${
                        currentStep > step.number ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>
                <p className={`mt-3 text-sm font-semibold text-center w-full ${
                  currentStep === step.number
                    ? 'text-civic-600'
                    : currentStep > step.number
                      ? 'text-emerald-600'
                      : 'text-slate-500'
                }`}>
                  {step.title}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Success Modal */}
        {successId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          >
            <div className="rounded-3xl bg-white p-8 text-center shadow-2xl">
              <div className="mb-4 flex justify-center">
                <FaCheckCircle className="text-5xl text-emerald-500" />
              </div>
              <h2 className="font-display text-2xl font-bold text-slateink-900">Complaint Submitted!</h2>
              <p className="mt-2 text-slate-600">Your complaint ID is:</p>
              <p className="mt-1 font-mono text-2xl font-bold text-civic-600">{successId}</p>
              <p className="mt-4 text-sm text-slate-500">Redirecting to your complaints...</p>
            </div>
          </motion.div>
        )}

        {/* Form Steps */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="rounded-3xl bg-white p-8 shadow-lg"
        >
          {/* Step Header */}
          <div className="mb-8 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-civic-100 text-2xl font-bold text-civic-600">
                {currentStep}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {currentStep}. {STEPS[currentStep - 1].title}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Step {currentStep} of {STEPS.length}
                </p>
              </div>
            </div>
          </div>

          {/* STEP 1: Issue Details */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slateink-900">
                  Complaint Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Broken streetlight near market"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-civic-500 focus:ring-2 focus:ring-civic-500/20 outline-none"
                />
                <p className="mt-1 text-xs text-slate-400">{title.length}/100 characters</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slateink-900 mb-3">
                  Category <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCategory(key)}
                      className={`rounded-xl px-4 py-3 text-center transition-all ${
                        category === key
                          ? 'border-2 border-civic-600 bg-civic-50'
                          : 'border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-2xl">{config.emoji}</div>
                      <div className="mt-1 text-sm font-medium text-slateink-900">{key}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slateink-900 mb-3">Priority</label>
                <div className="flex flex-wrap gap-3">
                  {['low', 'medium', 'high', 'urgent'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                        priority === p
                          ? `${PRIORITY_COLORS[p]} ring-2 ring-offset-2 ring-slate-300`
                          : PRIORITY_COLORS[p]
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slateink-900">
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  maxLength={500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-civic-500 focus:ring-2 focus:ring-civic-500/20 outline-none"
                />
                <p className="mt-1 text-xs text-slate-400">{description.length}/500 characters</p>

                <button
                  type="button"
                  onClick={handleAutoDetect}
                  disabled={detectLoading || description.length < 10}
                  className="mt-2 flex items-center gap-2 text-sm
                    bg-purple-100 hover:bg-purple-200
                    border border-purple-300 text-purple-700
                    px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
                >
                  {detectLoading ? '⏳ Detecting...' : '🤖 Auto-detect Category'}
                </button>

                {aiSuggestion && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="bg-emerald-100 border border-emerald-300 text-emerald-700 px-3 py-1 rounded-full">
                      ✅ AI: {aiSuggestion.category}
                    </span>
                    <span className="bg-amber-100 border border-amber-300 text-amber-700 px-3 py-1 rounded-full">
                      {aiSuggestion.confidence > 75 ? 'High confidence' : 'Moderate confidence'} ({aiSuggestion.confidence}%)
                    </span>
                    <span className="text-slate-400">— you can override above</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Location */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-4">
                  Select or confirm your complaint location
                </label>
                <LocationPicker onLocationSelect={handleLocationSelect} />
              </div>
            </div>
          )}

          {/* STEP 3: Media Upload */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-4">
                  Upload Media <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
                    dragActive ? 'border-civic-500 bg-civic-50' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <FaUpload className="mx-auto text-4xl text-slate-400 mb-3" />
                  <p className="text-base font-semibold text-slate-900">Drag images/videos here</p>
                  <p className="mt-2 text-sm text-slate-500">or</p>
                  <label className="mt-3 inline-block cursor-pointer">
                    <span className="font-semibold text-civic-600 hover:underline">click to select</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/mp4"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  <p className="mt-4 text-xs text-slate-400">Max 5 files, 50MB each</p>
                </div>
              </div>

              {mediaFiles.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-4">
                    {mediaFiles.length} file{mediaFiles.length !== 1 ? 's' : ''} selected
                  </p>
                  <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
                    {mediaFiles.map((file, index) => (
                      <div key={index} className="relative rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                        {file.type.startsWith('image/') ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt="preview"
                            className="aspect-square object-cover"
                          />
                        ) : (
                          <div className="aspect-square flex items-center justify-center bg-slate-100">
                            <FaPlay className="text-2xl text-slate-400" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-2 right-2 rounded-full bg-rose-500 text-white p-2 hover:bg-rose-600 shadow-md"
                        >
                          <FaTimes className="text-sm" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Review & Submit */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900">Review Your Complaint</h3>

              {/* Summary Cards */}
              <div className="space-y-3">
                <div className="rounded-lg bg-slate-50 p-5 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Category & Priority</p>
                  <div className="mt-3 flex gap-2">
                    <CategoryBadge category={category} />
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${PRIORITY_COLORS[priority]}`}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50 p-5 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Title</p>
                  <p className="mt-3 text-base font-semibold text-slate-900">{title}</p>
                </div>

                <div className="rounded-lg bg-slate-50 p-5 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Description</p>
                  <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">{description}</p>
                </div>

                <div className="rounded-lg bg-slate-50 p-5 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Location</p>
                  <p className="mt-3 text-sm font-medium text-slate-900">
                    {location?.address || 'Not specified'}, {location?.area}, {location?.city}
                  </p>
                  <p className="mt-2 text-xs text-slate-500 font-mono">
                    Lat: {location?.latitude?.toFixed(6)}, Lng: {location?.longitude?.toFixed(6)}
                  </p>
                </div>

                {mediaFiles.length > 0 && (
                  <div className="rounded-lg bg-slate-50 p-5 border border-slate-200">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Media ({mediaFiles.length} file{mediaFiles.length !== 1 ? 's' : ''})
                    </p>
                    <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
                      {mediaFiles.map((file, index) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden border border-slate-300 shadow-sm">
                          {file.type.startsWith('image/') ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt="preview"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-slate-200">
                              <FaPlay className="text-slate-500" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirmation Checkbox */}
              <label className="flex items-start gap-3 rounded-lg border border-slate-300 bg-slate-50 p-4 hover:bg-slate-100 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-civic-600 focus:ring-civic-500 cursor-pointer"
                />
                <span className="text-sm text-slate-700 leading-relaxed">
                  I confirm this complaint is genuine and the information is accurate.
                </span>
              </label>
            </div>
          )}
        </motion.div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            type="button"
            onClick={() => {
              if (currentStep > 1) {
                setCurrentStep(currentStep - 1);
              }
            }}
            disabled={currentStep === 1}
            className="flex items-center gap-2 rounded-xl bg-slate-200 px-8 py-3 font-semibold text-slate-700 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <FaChevronLeft className="text-sm" /> Back
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="ml-auto flex items-center gap-2 rounded-xl bg-civic-600 px-8 py-3 font-semibold text-white hover:bg-civic-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next <FaChevronRight className="text-sm" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !confirmed}
              className="ml-auto rounded-xl bg-emerald-600 px-8 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <InlineSpinner className="w-4 h-4 text-white" /> Submitting...
                </>
              ) : (
                <>
                  <FaCheckCircle /> Submit Complaint
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
