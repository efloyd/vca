import { useState, useCallback } from 'react';
import { AdminLogin } from '../components/admin/AdminLogin';
import { ContentInput } from '../components/admin/ContentInput';
import { DocumentList } from '../components/admin/DocumentList';
import { useDocuments } from '../hooks/useDocuments';
import { apiClient } from '../api/client';

export function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const {
    documents,
    isLoading,
    error,
    uploadDocument,
    deleteDocument,
    reprocessDocument,
    addWebResource,
  } = useDocuments(isAuthenticated);

  const handleLogin = useCallback((key: string) => {
    apiClient.setAdminKey(key);
    setIsAuthenticated(true);
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    await uploadDocument(file);
  }, [uploadDocument]);

  const handleAddUrl = useCallback(async (url: string, includeChildPages: boolean) => {
    await addWebResource(url, includeChildPages);
  }, [addWebResource]);

  const handleLogout = useCallback(() => {
    apiClient.setAdminKey(null);
    setIsAuthenticated(false);
  }, []);

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Document Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload and manage compliance documents for the VCA knowledge base
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5
                     border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Sign Out
        </button>
      </div>

      <div className="space-y-8">
        {/* Add Content Section */}
        <section>
          <h2 className="text-lg font-medium text-gray-900 mb-3">Add Content</h2>
          <ContentInput onUploadFile={handleUpload} onAddUrl={handleAddUrl} />
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <DocumentList
          documents={documents}
          isLoading={isLoading}
          onDelete={deleteDocument}
          onReprocess={reprocessDocument}
        />
      </div>
    </div>
  );
}
