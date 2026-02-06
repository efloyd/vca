import { useState, useCallback, useEffect } from 'react';
import type { DocumentInfo } from '../types';
import { apiClient } from '../api/client';

export function useDocuments(isAuthenticated: boolean) {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.listDocuments();
      setDocuments(data.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const uploadDocument = useCallback(async (file: File) => {
    setError(null);
    try {
      const doc = await apiClient.uploadDocument(file);
      setDocuments(prev => [doc, ...prev]);
      return doc;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      throw err;
    }
  }, []);

  const deleteDocument = useCallback(async (id: number) => {
    setError(null);
    try {
      await apiClient.deleteDocument(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }, []);

  const reprocessDocument = useCallback(async (id: number) => {
    setError(null);
    try {
      const doc = await apiClient.reprocessDocument(id);
      setDocuments(prev => prev.map(d => (d.id === id ? doc : d)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reprocess failed');
    }
  }, []);

  const addWebResource = useCallback(async (url: string, includeChildPages: boolean) => {
    setError(null);
    try {
      const doc = await apiClient.addWebResource({ url, include_child_pages: includeChildPages });
      setDocuments(prev => [doc, ...prev]);
      return doc;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add web resource';
      setError(message);
      throw err;
    }
  }, []);

  // Poll for processing documents
  useEffect(() => {
    if (!isAuthenticated) return;
    const hasProcessing = documents.some(d => d.status === 'processing');
    if (!hasProcessing) return;

    const interval = setInterval(fetchDocuments, 3000);
    return () => clearInterval(interval);
  }, [documents, isAuthenticated, fetchDocuments]);

  // Initial fetch
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    isLoading,
    error,
    uploadDocument,
    deleteDocument,
    reprocessDocument,
    addWebResource,
    refreshDocuments: fetchDocuments,
  };
}
