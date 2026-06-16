import React from 'react';
import { useToast } from '../../context/ToastContext';
import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiInfo, FiX } from 'react-icons/fi';

const toastConfig = {
  success: {
    icon: FiCheckCircle,
    className: 'bg-green-50 text-green-800 border-green-200',
    iconClass: 'text-green-500',
  },
  error: {
    icon: FiXCircle,
    className: 'bg-red-50 text-red-800 border-red-200',
    iconClass: 'text-red-500',
  },
  warning: {
    icon: FiAlertTriangle,
    className: 'bg-amber-50 text-amber-800 border-amber-200',
    iconClass: 'text-amber-500',
  },
  info: {
    icon: FiInfo,
    className: 'bg-blue-50 text-blue-800 border-blue-200',
    iconClass: 'text-blue-500',
  },
};

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
      {toasts.map((toast) => {
        const { icon: Icon, className, iconClass } = toastConfig[toast.type] || toastConfig.info;

        return (
          <div
            key={toast.id}
            className={`flex items-start p-4 border rounded-lg shadow-lg animate-in slide-in-from-right-full fade-in duration-300 ${className}`}
            role="alert"
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconClass}`} />
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
