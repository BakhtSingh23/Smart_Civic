import React from 'react';
import PropTypes from 'prop-types';

export default function Badge({
  children,
  variant = 'neutral',
  isPill = false,
  className = '',
  onClick,
  ...props
}) {
  const baseClasses = 'inline-block font-semibold whitespace-nowrap transition-colors';
  const shapeClasses = isPill ? 'px-3.5 py-2 text-sm rounded-full' : 'px-2 py-1 text-xs rounded-full';
  
  const variantClasses = {
    primary: 'bg-[rgba(30,64,175,0.1)] dark:bg-[rgba(59,130,246,0.15)] text-[var(--color-primary)] border border-[rgba(30,64,175,0.2)]',
    success: 'bg-[rgba(16,185,129,0.1)] dark:bg-[rgba(16,185,129,0.15)] text-[var(--color-success)] border border-[rgba(16,185,129,0.2)]',
    warning: 'bg-[rgba(245,158,11,0.1)] dark:bg-[rgba(251,191,36,0.15)] text-[var(--color-warning)] border border-[rgba(245,158,11,0.2)]',
    error: 'bg-[rgba(239,68,68,0.1)] dark:bg-[rgba(248,113,113,0.15)] text-[var(--color-error)] border border-[rgba(239,68,68,0.2)]',
    info: 'bg-[rgba(14,165,233,0.1)] dark:bg-[rgba(34,211,238,0.15)] text-[var(--color-info)] border border-[rgba(14,165,233,0.2)]',
    neutral: 'bg-[var(--color-gray-100)] dark:bg-[var(--color-gray-800)] text-[var(--color-gray-600)] dark:text-[var(--color-gray-400)] border border-[var(--color-gray-200)] dark:border-[var(--color-gray-700)]',
  };

  const interactiveClasses = onClick 
    ? 'cursor-pointer hover:bg-opacity-20 dark:hover:bg-opacity-25 focus-visible-ring' 
    : '';

  return (
    <span
      className={`${baseClasses} ${shapeClasses} ${variantClasses[variant]} ${interactiveClasses} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : 'status'}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick(e);
        }
      }}
      {...props}
    >
      {children}
    </span>
  );
}

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'success', 'warning', 'error', 'info', 'neutral']),
  isPill: PropTypes.bool,
  className: PropTypes.string,
  onClick: PropTypes.func,
};
