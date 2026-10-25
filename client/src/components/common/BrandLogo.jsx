import React from 'react';
import { Link } from 'react-router-dom';

export default function BrandLogo({ size = 'md', light = false, linkTo = '/' }) {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  const content = (
    <div className="flex items-center gap-3 font-sans group">
      {/* Icon matching reference: Circular teal pin badge with inner pathway silhouette */}
      <div className={`relative flex items-center justify-center ${iconSizes[size]} rounded-full bg-palette-secondary shadow-md shadow-palette-secondary/25 transition-transform group-hover:scale-105 duration-300 shrink-0`}>
        <svg viewBox="0 0 32 32" fill="none" className="w-5/6 h-5/6" xmlns="http://www.w3.org/2000/svg">
          {/* Shield / Pin perimeter */}
          <path
            d="M16 4C10.4772 4 6 8.47715 6 14C6 19.5 12 26 16 28C20 26 26 19.5 26 14C26 8.47715 21.5228 4 16 4Z"
            fill="#16A085"
          />
          {/* Inner white winding road / pathway */}
          <path
            d="M16 7C12.134 7 9 10.134 9 14C9 17.5 13 22 16 24C19 22 23 17.5 23 14C23 10.134 19.866 7 16 7Z"
            fill="white"
          />
          <path
            d="M16 9C17.5 11 18 13.5 18 16C18 18.5 17 21 16 23C15 21 14 18.5 14 16C14 13.5 14.5 11 16 9Z"
            fill="#0B3D2E"
          />
        </svg>
      </div>

      <div className="flex flex-col">
        <span className={`font-extrabold tracking-tight font-sans ${textSizes[size]} ${light ? 'text-white' : 'text-palette-primary'} leading-none`}>
          SAFE PASSAGE
        </span>
        <span className={`text-[10px] tracking-wide font-medium ${light ? 'text-slate-300' : 'text-palette-muted'} mt-1`}>
          Safer Journeys. Brighter Futures.
        </span>
      </div>
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
