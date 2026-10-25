import React from 'react';

export default function Table({
  columns = [],
  data = [],
  keyField = '_id',
  isLoading = false,
  emptyMessage = 'No records found matching criteria.',
  className = '',
  onRowClick,
}) {
  return (
    <div className={`w-full overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-card ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wider">
            {columns.map((col, idx) => (
              <th key={col.key || idx} className={`px-6 py-4 ${col.headerClassName || ''}`}>
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm text-brand-text font-normal">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-brand-teal border-t-transparent rounded-full animate-spin" />
                  <span>Loading data...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={row[keyField] || rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`
                  transition-colors hover:bg-slate-50/70
                  ${onRowClick ? 'cursor-pointer' : ''}
                `}
              >
                {columns.map((col, colIdx) => (
                  <td key={col.key || colIdx} className={`px-6 py-4 align-middle ${col.cellClassName || ''}`}>
                    {col.render ? col.render(row[col.dataIndex], row, rowIdx) : row[col.dataIndex]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
