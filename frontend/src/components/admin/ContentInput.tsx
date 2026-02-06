import { useState, useRef, useCallback } from 'react';

type InputMode = 'file' | 'url';

interface ContentInputProps {
  onUploadFile: (file: File) => Promise<void>;
  onAddUrl: (url: string, includeChildPages: boolean) => Promise<void>;
}

export function ContentInput({ onUploadFile, onAddUrl }: ContentInputProps) {
  const [mode, setMode] = useState<InputMode>('file');

  // File upload state
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL input state
  const [url, setUrl] = useState('');
  const [includeChildPages, setIncludeChildPages] = useState(false);
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setUploadError(null);
    setIsUploading(true);
    try {
      await onUploadFile(file);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [onUploadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }, [handleFile]);

  const handleUrlSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setUrlError('Please enter a URL');
      return;
    }

    try {
      new URL(url);
    } catch {
      setUrlError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    setUrlError(null);
    setIsAddingUrl(true);

    try {
      await onAddUrl(url.trim(), includeChildPages);
      setUrl('');
      setIncludeChildPages(false);
    } catch (err) {
      setUrlError(err instanceof Error ? err.message : 'Failed to add web resource');
    } finally {
      setIsAddingUrl(false);
    }
  }, [url, includeChildPages, onAddUrl]);

  const isProcessing = isUploading || isAddingUrl;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setMode('file')}
          disabled={isProcessing}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2
            ${mode === 'file'
              ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload File
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          disabled={isProcessing}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2
            ${mode === 'url'
              ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          Add Web Page
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {mode === 'file' ? (
          <div>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                ${isDragging
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.docx,.txt,.csv,.md,.html"
                className="hidden"
              />
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-6 h-6 text-primary-500 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path fill="currentColor" className="opacity-75"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-sm text-gray-600">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm text-gray-600">
                    <span className="text-primary-600 font-medium">Click to upload</span>
                    {' '}or drag and drop
                  </p>
                  <p className="text-xs text-gray-400">
                    PDF, DOCX, TXT, CSV, MD, HTML
                  </p>
                </div>
              )}
            </div>
            {uploadError && (
              <p className="text-sm text-red-500 mt-2">{uploadError}</p>
            )}
          </div>
        ) : (
          <form onSubmit={handleUrlSubmit} className="space-y-3">
            <div>
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com/compliance-guide"
                disabled={isAddingUrl}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                  disabled:bg-gray-50 disabled:text-gray-400 placeholder-gray-400"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeChildPages}
                  onChange={e => setIncludeChildPages(e.target.checked)}
                  disabled={isAddingUrl}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 disabled:opacity-50"
                />
                <span className="text-sm text-gray-600">Include child pages</span>
              </label>

              <button
                type="submit"
                disabled={!url.trim() || isAddingUrl}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg
                  hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                  transition-colors flex items-center gap-2"
              >
                {isAddingUrl ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path fill="currentColor" className="opacity-75"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Adding...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add URL
                  </>
                )}
              </button>
            </div>

            {includeChildPages && (
              <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                Will crawl linked pages on the same domain (max 50 pages, 2 levels deep).
              </p>
            )}

            {urlError && (
              <p className="text-sm text-red-500">{urlError}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
