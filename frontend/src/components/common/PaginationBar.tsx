import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isDark: boolean;
  itemLabel?: string;
  accentColor?: 'red' | 'blue' | 'pink';
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  isDark,
  itemLabel = 'आइटम',
  accentColor = 'red',
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getAccentColorClass = () => {
    switch (accentColor) {
      case 'blue':
        return 'text-blue-500';
      case 'pink':
        return 'text-pink-500';
      case 'red':
      default:
        return 'text-red-500';
    }
  };

  const getActiveButtonClass = () => {
    switch (accentColor) {
      case 'blue':
        return 'bg-blue-600 text-white shadow-md';
      case 'pink':
        return 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md';
      case 'red':
      default:
        return 'bg-red-600 text-white shadow';
    }
  };

  return (
    <div
      className={`mt-4 pt-3.5 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}
    >
      <div className={isDark ? 'text-slate-400' : 'text-slate-600'}>
        दिख रहे हैं{' '}
        <span className={`font-bold font-mono ${getAccentColorClass()}`}>
          {startItem} - {endItem}
        </span>{' '}
        (कुल <span className="font-bold font-mono">{totalItems}</span> {itemLabel})
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 border disabled:opacity-40 disabled:cursor-not-allowed ${
            isDark
              ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
              : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm'
          }`}
        >
          <ChevronLeft size={14} />
          <span>पिछला</span>
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, idx) => idx + 1)
            .filter(
              (pageNum) =>
                pageNum === 1 ||
                pageNum === totalPages ||
                Math.abs(pageNum - currentPage) <= 1
            )
            .map((pageNum, idx, arr) => {
              const prev = arr[idx - 1];
              const showEllipsis = prev && pageNum - prev > 1;
              return (
                <React.Fragment key={pageNum}>
                  {showEllipsis && (
                    <span className="px-1 text-slate-500 font-bold">...</span>
                  )}
                  <button
                    type="button"
                    onClick={() => onPageChange(pageNum)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl font-bold text-xs transition font-mono flex items-center justify-center ${
                      pageNum === currentPage
                        ? getActiveButtonClass()
                        : isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-sm'
                    }`}
                  >
                    {pageNum}
                  </button>
                </React.Fragment>
              );
            })}
        </div>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 border disabled:opacity-40 disabled:cursor-not-allowed ${
            isDark
              ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
              : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm'
          }`}
        >
          <span>अगला</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

