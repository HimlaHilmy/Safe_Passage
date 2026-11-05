import React from 'react';
import { Link } from 'react-router-dom';

export default function PageHeader({
  title,
  subtitle,
  badge,
  action,
  breadcrumbs = [],
  className = '',
}) {
  return (
    <div className={`mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 pb-6 ${className}`}>
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
            {breadcrumbs.map((crumb, idx) => {
              const label = typeof crumb === 'object' && crumb !== null ? crumb.label : crumb;
              const path = typeof crumb === 'object' && crumb !== null ? crumb.path : null;
              const isLast = idx === breadcrumbs.length - 1;

              return (
                <React.Fragment key={idx}>
                  {idx > 0 && <span>/</span>}
                  {path && !isLast ? (
                    <Link to={path} className="hover:text-brand-teal transition-colors">
                      {label}
                    </Link>
                  ) : (
                    <span className={isLast ? 'text-brand-teal font-semibold' : 'hover:text-slate-600'}>
                      {label}
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl md:text-3xl font-extrabold text-brand-navy tracking-tight">
            {title}
          </h1>
          {badge && <div>{badge}</div>}
        </div>
        {subtitle && <p className="text-sm text-slate-500 mt-1 leading-relaxed">{subtitle}</p>}
      </div>

      {action && <div className="flex items-center gap-3 shrink-0">{action}</div>}
    </div>
  );
}
