import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import PropTypes from 'prop-types';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  className = '',
}) {
  const overlayRef = useRef(null);
  const modalRef = useRef(null);

  // Keep a stable ref to onClose so the effect doesn't re-fire on every parent render
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      gsap.fromTo(overlayRef.current, 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.2, ease: 'power2.out' }
      );
      
      gsap.fromTo(modalRef.current,
        { scale: 0.9, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.3, ease: 'back.out(1.2)' }
      );
      
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onCloseRef.current();
      };
      window.addEventListener('keydown', handleKeyDown);
      
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === overlayRef.current) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] h-[95vh]'
  };

  const modalContent = (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-[1000] bg-black/50 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div 
        ref={modalRef}
        className={`bg-[var(--bg-tertiary)] w-full rounded-2xl shadow-2xl flex flex-col overflow-hidden ${sizeClasses[size]} ${className}`}
        style={{ maxHeight: 'calc(100vh - 4rem)' }}
      >
        {(title || onClose) && (
          <div className="px-6 py-4 border-b border-[var(--border-color)] flex justify-between items-center shrink-0">
            {title && <h3 id="modal-title" className="text-xl font-bold text-[var(--text-primary)] m-0">{title}</h3>}
            {onClose && (
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors ml-auto"
                onClick={handleClose}
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>

        {footer && (
          <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.node,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'full']),
  closeOnOverlayClick: PropTypes.bool,
  className: PropTypes.string,
};
