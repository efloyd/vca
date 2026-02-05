import type { DocumentInfo } from '../../types';
import { DocumentRow } from './DocumentRow';

interface DocumentListProps {
  documents: DocumentInfo[];
  isLoading: boolean;
  onDelete: (id: number) => void;
  onReprocess: (id: number) => void;
}

export function DocumentList({ documents, isLoading, onDelete, onReprocess }: DocumentListProps) {
  if (isLoading && documents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        Loading documents...
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
        <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-500 text-sm">No documents uploaded yet</p>
        <p className="text-gray-400 text-xs mt-1">Upload compliance documents to get started</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">File</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chunks</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {documents.map(doc => (
              <DocumentRow
                key={doc.id}
                document={doc}
                onDelete={onDelete}
                onReprocess={onReprocess}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
