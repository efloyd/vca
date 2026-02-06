import { useState } from 'react';

interface WebResourceFormProps {
  onSubmit: (url: string, includeChildPages: boolean) => Promise<void>;
}

export function WebResourceForm({ onSubmit }: WebResourceFormProps) {
  const [url, setUrl] = useState('');
  const [includeChildPages, setIncludeChildPages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(url.trim(), includeChildPages);
      setUrl('');
      setIncludeChildPages(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add web resource');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Add Web Page</h3>

      <div className="space-y-3">
        <div>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com/compliance-guide"
            disabled={isSubmitting}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500
                       focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400
                       placeholder-gray-400"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeChildPages}
              onChange={e => setIncludeChildPages(e.target.checked)}
              disabled={isSubmitting}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded
                         focus:ring-primary-500 disabled:opacity-50"
            />
            <span className="text-sm text-gray-600">
              Include child pages
            </span>
          </label>

          <button
            type="submit"
            disabled={!url.trim() || isSubmitting}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium
                       rounded-lg hover:bg-primary-700 disabled:bg-gray-300
                       disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                Add URL
              </>
            )}
          </button>
        </div>

        {includeChildPages && (
          <p className="text-xs text-gray-500">
            Will crawl linked pages on the same domain (max 50 pages, 2 levels deep).
          </p>
        )}

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    </form>
  );
}
