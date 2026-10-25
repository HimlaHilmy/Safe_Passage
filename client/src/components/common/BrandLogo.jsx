import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import logoTransparent from '../../assets/logo-transparent.png';

export default function BrandLogo({ size = 'md', light = false, linkTo = '/', showTagline = true, iconOnly = false }) {
  const iconSizes = {
    xs: 'w-7 h-7',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  const content = (
    <div className="flex items-center gap-3 font-sans group">
      {/* Brand Logo Graphic Icon */}
      <div
        className={`relative flex items-center justify-center ${iconSizes[size] || iconSizes.md} rounded-2xl overflow-hidden shadow-md shadow-brand-teal/20 transition-transform group-hover:scale-105 duration-300 shrink-0 ${
          light ? 'bg-white p-1' : 'bg-white p-0.5 border border-slate-100 shadow-sm'
        }`}
      >
        <img
          src={logoTransparent}
          alt="Safe Passage Logo"
          className="w-full h-full object-contain"
        />
      </div>

      {!iconOnly && (
        <div className="flex flex-col">
          <span
            className={`font-black tracking-tight font-sans ${textSizes[size] || textSizes.md} ${
              light ? 'text-white' : 'text-brand-navy'
            } leading-none`}
          >
            Safe Passage
          </span>
          {showTagline && (
            <span
              className={`text-[10px] tracking-wide font-semibold ${
                light ? 'text-slate-300' : 'text-slate-500'
              } mt-1`}
            >
              Travel with confidence. Get help when it matters.
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="inline-block focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
