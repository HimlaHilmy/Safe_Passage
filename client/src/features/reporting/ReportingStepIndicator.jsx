import React from 'react';
import { Check } from 'lucide-react';

export default function ReportingStepIndicator({ steps, currentStep, onStepClick }) {
  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between relative">
        {/* Background connector line */}
        <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-slate-200 z-0" />
        
        {/* Active connector progress bar */}
        <div
          className="absolute top-1/2 left-6 -translate-y-1/2 h-1 bg-brand-teal transition-all duration-300 z-0"
          style={{
            width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
          }}
        />

        {steps.map((step, idx) => {
          const stepNumber = idx + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isClickable = isCompleted;

          return (
            <div
              key={step.id || idx}
              onClick={() => isClickable && onStepClick && onStepClick(stepNumber)}
              className={`relative z-10 flex flex-col items-center text-center group ${
                isClickable ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <div
                className={`
                  w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-200
                  ${
                    isCurrent
                      ? 'bg-brand-navy text-white ring-4 ring-brand-teal/30 scale-105 shadow-md'
                      : isCompleted
                      ? 'bg-brand-teal text-brand-navy group-hover:scale-105 shadow-xs'
                      : 'bg-white border-2 border-slate-300 text-slate-400'
                  }
                `}
              >
                {isCompleted ? <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" /> : stepNumber}
              </div>
              <span
                className={`text-[11px] sm:text-xs mt-2 font-semibold tracking-tight transition-colors hidden sm:block ${
                  isCurrent
                    ? 'text-brand-navy font-bold'
                    : isCompleted
                    ? 'text-slate-700'
                    : 'text-slate-400'
                }`}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile step label below */}
      <div className="mt-3 text-center sm:hidden">
        <span className="text-xs font-bold text-brand-navy">
          Step {currentStep} of {steps.length}:{' '}
        </span>
        <span className="text-xs text-brand-teal font-semibold">
          {steps[currentStep - 1]?.title}
        </span>
      </div>
    </div>
  );
}

