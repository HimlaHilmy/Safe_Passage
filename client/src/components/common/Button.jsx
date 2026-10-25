import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  iconPosition = 'left',
  type = 'button',
  onClick,
  className = '',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none cursor-pointer';

  const variants = {
    primary: 'bg-brand-teal hover:bg-brand-teal-dark text-brand-navy font-semibold shadow-md shadow-brand-teal/20 focus:ring-brand-teal',
    secondary: 'bg-brand-navy hover:bg-brand-navy-light text-white shadow-md shadow-brand-navy/20 focus:ring-brand-navy',
    emergency: 'bg-emergency-red hover:bg-emergency-red-dark text-white font-bold shadow-md shadow-emergency-red/30 focus:ring-emergency-red beacon-pulse-red',
    emergencyStatic: 'bg-emergency-red hover:bg-emergency-red-dark text-white font-bold shadow-md shadow-emergency-red/30 focus:ring-emergency-red',
    outline: 'border-2 border-slate-200 hover:border-brand-teal text-brand-navy hover:text-brand-teal bg-white focus:ring-brand-teal',
    ghost: 'text-slate-600 hover:text-brand-navy hover:bg-slate-100 focus:ring-slate-300',
    white: 'bg-white hover:bg-slate-50 text-brand-navy font-semibold shadow-md focus:ring-white',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        ${baseStyles}
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </button>
  );
}
