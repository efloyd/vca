import type { DocumentInfo } from '../../types';

interface DocumentRowProps {
  document: DocumentInfo;
  onDelete: (id: number) => void;
  onReprocess: (id: number) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const statusStyles: Record<string, string> = {
  processing: 'bg-yellow-100 text-yellow-800',
  ready: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
};

export function DocumentRow({ document, onDelete, onReprocess }: DocumentRowProps) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
            {document.original_filename}
          </span>
          <span className="text-xs text-gray-400 uppercase">{document.file_type}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          statusStyles[document.status] || 'bg-gray-100 text-gray-800'
        }`}>
          {document.status === 'processing' && (
            <svg className="w-3 h-3 mr-1 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path fill="currentColor" className="opacity-75"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {document.status}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{document.chunk_count}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{formatFileSize(document.file_size)}</td>
      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(document.created_at)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {document.status === 'error' && (
            <button
              onClick={() => onReprocess(document.id)}
              className="text-xs text-primary-600 hover:text-primary-800 font-medium"
              title={document.error_message || 'Reprocess document'}
            >
              Retry
            </button>
          )}
          <button
            onClick={() => onDelete(document.id)}
            className="text-xs text-red-500 hover:text-red-700 font-medium"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
