import { useState } from 'react';

interface AdminLoginProps {
  onLogin: (key: string) => void;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) {
      setError('Please enter an admin key');
      return;
    }
    setError('');
    onLogin(key.trim());
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center
                            justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Admin Access</h2>
            <p className="text-sm text-gray-500 mt-1">
              Enter your admin API key to manage documents
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={key}
                onChange={e => setKey(e.target.value)}
                placeholder="Admin API Key"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary-500
                           focus:border-transparent placeholder-gray-400"
              />
              {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-primary-600 text-white rounded-xl text-sm
                         font-medium hover:bg-primary-700 transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
