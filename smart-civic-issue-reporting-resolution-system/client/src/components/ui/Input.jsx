import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

const Input = forwardRef(({
  label,
  id,
  type = 'text',
  error,
  success,
  loading,
  className = '',
  required,
  ...props
}, ref) => {
  const defaultId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const baseClasses = 'w-full h-10 px-3 py-2 text-base font-normal bg-[var(--bg-tertiary)] text-[var(--text-primary)] border rounded-lg transition-fast placeholder-[var(--text-muted)]';
  
  let stateClasses = 'border-[var(--border-color)] shadow-xs hover:border-[var(--color-primary)] hover:shadow-sm focus:border-[var(--color-primary)] focus:focus-ring';
  
  if (error) {
    stateClasses = 'border-[var(--color-error)] focus:focus-ring shadow-xs';
  } else if (success) {
    stateClasses = 'border-[var(--color-success)] focus:focus-ring shadow-xs';
  }

  const disabledClasses = props.disabled ? 'opacity-50 cursor-not-allowed bg-[var(--bg-secondary)]' : '';

  return (
    <div className={`relative mb-4 ${className}`}>
      {label && (
        <label htmlFor={defaultId} className="block mb-1.5 text-[0.875rem] font-medium text-[var(--text-secondary)]">
          {label}
          {required && <span className="text-[var(--color-error)] ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={defaultId}
          type={type}
          className={`${baseClasses} ${stateClasses} ${disabledClasses} ${error ? 'animate-shake' : ''}`}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${defaultId}-error` : undefined}
          {...props}
        />
        
        {/* Right side indicators */}
        {(success || loading) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            {loading && (
               <svg className="animate-spin-slow h-4 w-4 text-[var(--color-primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
            )}
            {success && !loading && (
              <svg className="h-5 w-5 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        )}
      </div>
      
      {error && (
        <p id={`${defaultId}-error`} className="mt-1 text-xs text-[var(--color-error)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  label: PropTypes.string,
  id: PropTypes.string,
  type: PropTypes.string,
  error: PropTypes.string,
  success: PropTypes.bool,
  loading: PropTypes.bool,
  className: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
};

export default Input;
