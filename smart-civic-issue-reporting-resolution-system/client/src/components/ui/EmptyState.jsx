import React from 'react';

export const EmptyState = ({
  illustration,
  title,
  description,
  actionLabel,
  onAction,
  className = ""
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
      {illustration && (
        <div className="mb-4 text-6xl text-slate-400">
          {illustration}
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-slate-500 max-w-sm mb-6">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:ring-4 focus:ring-primary-100 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
