import React, { useCallback, useRef, useState } from 'react';
import { FiUpload, FiX, FiImage } from 'react-icons/fi';

export default function ImageUploadZone({ label, files, onChange, maxFiles = 5, uploading = false, progress = 0 }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = (incoming) => {
    const merged = [...files];
    for (const f of incoming) {
      if (merged.length >= maxFiles) break;
      if (!merged.find(x => x.name === f.name && x.size === f.size)) merged.push(f);
    }
    onChange(merged);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, [files]);

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const remove = (idx) => {
    const updated = files.filter((_, i) => i !== idx);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {label && <p className="text-sm font-semibold text-slate-700">{label}</p>}

      {/* Drop zone */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
          ${dragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <FiUpload className="mx-auto text-slate-400 mb-2" size={28} />
        <p className="text-sm font-medium text-slate-600">
          {files.length === 0 ? 'Tap to add photos' : `${files.length} / ${maxFiles} selected`}
        </p>
        <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP up to 50 MB each</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={e => addFiles(Array.from(e.target.files))}
          disabled={uploading}
        />
      </div>

      {/* Progress bar */}
      {uploading && progress > 0 && (
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Thumbnails */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {files.map((f, idx) => (
            <div key={idx} className="relative group">
              {f.type?.startsWith('image') ? (
                <img
                  src={URL.createObjectURL(f)}
                  alt=""
                  className="w-full h-24 object-cover rounded-lg border border-slate-200"
                />
              ) : (
                <div className="w-full h-24 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
                  <FiImage size={24} className="text-slate-400" />
                </div>
              )}
              {!uploading && (
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FiX size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
