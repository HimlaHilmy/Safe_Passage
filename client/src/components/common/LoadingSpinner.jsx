import React from 'react';

export default function LoadingSpinner({ size = 'md', text = 'Loading...', fullPage = false }) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`
          rounded-full border-brand-teal/20 border-t-brand-teal animate-spin
          ${sizeClasses[size] || sizeClasses.md}
        `}
      />
      {text && <p className="text-xs font-medium text-slate-500 animate-pulse">{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center w-full">
        {spinner}
      </div>
    );
  }

  return spinner;
}
