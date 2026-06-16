import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import PropTypes from 'prop-types';

export default function Card({
  children,
  variant = 'base',
  interactive = false,
  className = '',
  onClick,
  ...props
}) {
  const ref = useRef();

  useEffect(() => {
    if (!interactive) return;

    const el = ref.current;
    
    // Scale or translateY effect
    const hoverAnim = gsap.to(el, {
      y: -2,
      scale: variant === 'elevated' ? 1.02 : 1,
      boxShadow: variant === 'elevated' ? '0 25px 50px rgba(0,0,0,0.15)' : '0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)',
      borderColor: variant !== 'filled' ? 'var(--color-primary)' : undefined,
      duration: 0.2,
      ease: 'ease-out',
      paused: true
    });

    const onMouseEnter = () => hoverAnim.play();
    const onMouseLeave = () => hoverAnim.reverse();

    el.addEventListener('mouseenter', onMouseEnter);
    el.addEventListener('mouseleave', onMouseLeave);

    return () => {
      el.removeEventListener('mouseenter', onMouseEnter);
      el.removeEventListener('mouseleave', onMouseLeave);
      hoverAnim.kill();
    };
  }, [interactive, variant]);

  const baseClasses = 'rounded-xl overflow-hidden transition-all duration-200';
  
  const variantClasses = {
    base: 'bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xs p-4 md:p-6',
    elevated: 'bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-lg p-4 md:p-6',
    bordered: 'bg-transparent border-2 border-[var(--color-gray-300)] dark:border-[var(--color-gray-600)] p-4 md:p-6',
    filled: 'bg-[rgba(30,64,175,0.08)] border border-[rgba(30,64,175,0.2)] p-4 md:p-6',
  };

  const interactiveClasses = interactive || onClick ? 'cursor-pointer' : '';

  return (
    <div
      ref={ref}
      className={`${baseClasses} ${variantClasses[variant]} ${interactiveClasses} ${className}`}
      onClick={onClick}
      role={interactive || onClick ? 'button' : 'article'}
      tabIndex={interactive || onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if ((interactive || onClick) && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick && onClick(e);
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['base', 'elevated', 'bordered', 'filled']),
  interactive: PropTypes.bool,
  className: PropTypes.string,
  onClick: PropTypes.func,
};
