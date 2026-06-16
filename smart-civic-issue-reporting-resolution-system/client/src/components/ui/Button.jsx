import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import PropTypes from 'prop-types';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  icon = null,
  ...props
}) {
  const ref = useRef();

  useEffect(() => {
    const el = ref.current;
    if (!el || disabled || loading) return;

    const hoverAnim = gsap.to(el, {
      scale: 1.02,
      duration: 0.2,
      ease: 'ease-out',
      paused: true,
      boxShadow: '0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)'
    });

    const onMouseEnter = () => hoverAnim.play();
    const onMouseLeave = () => hoverAnim.reverse();
    const onMouseDown = () => gsap.to(el, { scale: 0.97, duration: 0.1 });
    const onMouseUp = () => gsap.to(el, { scale: 1.02, duration: 0.1 });

    el.addEventListener('mouseenter', onMouseEnter);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseup', onMouseUp);

    return () => {
      el.removeEventListener('mouseenter', onMouseEnter);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseup', onMouseUp);
      hoverAnim.kill();
    };
  }, [disabled, loading]);

  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus-visible-ring rounded-lg relative overflow-hidden';
  
  const sizeClasses = {
    xs: 'h-7 px-2 text-xs',
    sm: 'h-9 px-3 text-[13px]',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-5 text-[15px]',
    xl: 'h-12 px-6 text-base',
  };

  const variantClasses = {
    primary: 'bg-[var(--color-primary)] text-white hover:brightness-110 shadow-sm',
    secondary: 'bg-transparent border-[1.5px] border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[rgba(30,64,175,0.08)]',
    danger: 'bg-[var(--color-error)] text-white hover:brightness-110 shadow-sm',
    success: 'bg-[var(--color-success)] text-white hover:brightness-110 shadow-sm',
    ghost: 'bg-transparent text-[var(--color-primary)] hover:bg-[rgba(30,64,175,0.08)] border-none',
  };

  const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer';

  return (
    <button
      ref={ref}
      type={type}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabledClasses} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin-slow -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!loading && icon && <span className="mr-2">{icon}</span>}
      <span className={loading ? 'invisible' : ''}>{children}</span>
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success', 'ghost']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  className: PropTypes.string,
  type: PropTypes.string,
  icon: PropTypes.node,
};
