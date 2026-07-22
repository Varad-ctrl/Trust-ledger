import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
      <p className="text-sm text-gray-500">Page {page} of {pages}</p>
      <div className="flex gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page <= 1}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
          const p = i + 1;
          return (
            <button key={p} onClick={() => onPage(p)}
              className={`w-8 h-8 text-sm rounded-lg font-medium ${p === page ? 'bg-brand-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
              {p}
            </button>
          );
        })}
        <button onClick={() => onPage(page + 1)} disabled={page >= pages}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
