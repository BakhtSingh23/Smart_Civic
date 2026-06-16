import React from 'react';

export const InlineSpinner = ({ className = "w-5 h-5" }) => (
  <svg
    className={`animate-spin text-current ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

export const OverlaySpinner = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
    <InlineSpinner className="w-12 h-12 text-primary-600" />
  </div>
);

export const SkeletonLoader = ({ className = "h-32 w-full rounded-xl" }) => (
  <div className={`animate-pulse bg-slate-200 ${className}`}></div>
);
