import React from 'react';

export default function Card({
  children,
  title,
  subtitle,
  action,
  icon: Icon,
  variant = 'default',
  hoverable = false,
  className = '',
  bodyClassName = '',
  headerClassName = '',
  onClick,
  ...props
}) {
  const variants = {
    default: 'bg-white border border-slate-100 shadow-card',
    glass: 'glass-panel shadow-card',
    dark: 'glass-panel-dark text-white shadow-xl',
    emergency: 'bg-red-50/60 border border-red-200 shadow-sm',
    flat: 'bg-white border border-slate-200',
  };

  return (
    <div
      onClick={onClick}
      className={`
        rounded-2xl transition-all duration-300 overflow-hidden
        ${variants[variant] || variants.default}
        ${hoverable ? 'hover:shadow-card-hover hover:-translate-y-1 cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {(title || subtitle || action || Icon) && (
        <div className={`px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 ${headerClassName}`}>
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-xl bg-brand-teal/10 text-brand-teal">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              {title && <h3 className="font-bold text-base text-brand-navy leading-tight">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={`p-6 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
