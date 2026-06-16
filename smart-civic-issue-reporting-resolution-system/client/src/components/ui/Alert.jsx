import React, { useState, useEffect } from 'react';
import { gsap } from 'gsap';
import PropTypes from 'prop-types';

export default function Alert({
  children,
  variant = 'info',
  title,
  icon = true,
  dismissible = false,
  onDismiss,
  className = '',
  ...props
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isVisible && onDismiss) {
      onDismiss();
    }
  }, [isVisible, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const variantStyles = {
    success: {
      container: 'bg-[rgba(16,185,129,0.1)] border-l-[var(--color-success)]',
      iconColor: 'text-[var(--color-success)]',
      defaultIcon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    warning: {
      container: 'bg-[rgba(245,158,11,0.1)] border-l-[var(--color-warning)]',
      iconColor: 'text-[var(--color-warning)]',
      defaultIcon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    error: {
      container: 'bg-[rgba(239,68,68,0.1)] border-l-[var(--color-error)]',
      iconColor: 'text-[var(--color-error)]',
      defaultIcon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    info: {
      container: 'bg-[rgba(14,165,233,0.1)] border-l-[var(--color-info)]',
      iconColor: 'text-[var(--color-info)]',
      defaultIcon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  };

  const style = variantStyles[variant];

  return (
    <div
      className={`p-4 rounded-lg border-l-4 flex gap-3 mb-4 ${style.container} ${className}`}
      role="alert"
      {...props}
    >
      {icon && (
        <div className={`flex-shrink-0 ${style.iconColor}`}>
          {typeof icon === 'boolean' ? style.defaultIcon : icon}
        </div>
      )}
      
      <div className="flex-1">
        {title && <h4 className="text-sm font-semibold mb-1 text-[var(--text-primary)]">{title}</h4>}
        <div className="text-sm text-[var(--text-secondary)]">
          {children}
        </div>
      </div>

      {dismissible && (
        <button
          type="button"
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors"
          onClick={handleDismiss}
          aria-label="Dismiss alert"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

Alert.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['success', 'warning', 'error', 'info']),
  title: PropTypes.string,
  icon: PropTypes.oneOfType([PropTypes.bool, PropTypes.node]),
  dismissible: PropTypes.bool,
  onDismiss: PropTypes.func,
  className: PropTypes.string,
};
