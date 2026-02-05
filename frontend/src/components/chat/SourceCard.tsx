import { useState } from 'react';
import type { SourceReference } from '../../types';

interface SourceCardProps {
  source: SourceReference;
  index: number;
}

export function SourceCard({ source, index }: SourceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const scorePercent = Math.round(source.relevance_score * 100);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-left
                   bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex-shrink-0 w-5 h-5 bg-primary-100 text-primary-700
                           rounded text-xs font-medium flex items-center justify-center">
            {index + 1}
          </span>
          <span className="text-sm text-gray-700 truncate">
            {source.document_name}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-500">{scorePercent}% match</span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {isExpanded && (
        <div className="px-3 py-2 text-xs text-gray-600 bg-white border-t border-gray-100">
          {source.chunk_text}
        </div>
      )}
    </div>
  );
}
