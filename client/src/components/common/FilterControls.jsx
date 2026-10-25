import React from 'react';

export default function FilterControls({
  categories = [],
  selectedCategory = '',
  onSelectCategory,
  radiusOptions = [5000, 15000, 30000, 50000],
  selectedRadius = 50000,
  onSelectRadius,
  showRadius = true,
  className = '',
}) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${className}`}>
      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => onSelectCategory('')}
          className={`
            px-3 py-1.5 rounded-full text-xs font-semibold transition-all
            ${!selectedCategory
              ? 'bg-brand-navy text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}
          `}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat === selectedCategory ? '' : cat)}
            className={`
              px-3 py-1.5 rounded-full text-xs font-semibold transition-all
              ${selectedCategory === cat
                ? 'bg-brand-teal text-brand-navy font-bold shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Radius Dropdown (Optional for map discovery) */}
      {showRadius && onSelectRadius && (
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span>Search Radius:</span>
          <select
            value={selectedRadius}
            onChange={(e) => onSelectRadius(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-brand-text font-semibold focus:outline-none focus:ring-1 focus:ring-brand-teal"
          >
            {radiusOptions.map((rad) => (
              <option key={rad} value={rad}>
                {rad >= 1000 ? `${rad / 1000} km` : `${rad} m`}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
