import type { DocumentInfo, SSEEvent } from '../types';

const BASE_URL = '/api';

class APIClient {
  private adminKey: string | null = null;

  setAdminKey(key: string | null) {
    this.adminKey = key;
  }

  private authHeaders(): Record<string, string> {
    if (!this.adminKey) return {};
    return { Authorization: `Bearer ${this.adminKey}` };
  }

  async health() {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  }

  async *streamChat(message: string): AsyncGenerator<SSEEvent> {
    const res = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    if (!res.ok) {
      throw new Error(`Chat request failed: ${res.statusText}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const data = trimmed.slice(6);
          if (data === '[DONE]') return;
          try {
            yield JSON.parse(data) as SSEEvent;
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  }

  async uploadDocument(file: File): Promise<DocumentInfo> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${BASE_URL}/documents/upload`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  }

  async listDocuments(): Promise<{ documents: DocumentInfo[]; total: number }> {
    const res = await fetch(`${BASE_URL}/documents`, {
      headers: this.authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to list documents');
    return res.json();
  }

  async deleteDocument(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/documents/${id}`, {
      method: 'DELETE',
      headers: this.authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete document');
  }

  async reprocessDocument(id: number): Promise<DocumentInfo> {
    const res = await fetch(`${BASE_URL}/documents/${id}/reprocess`, {
      method: 'POST',
      headers: this.authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to reprocess document');
    return res.json();
  }
}

export const apiClient = new APIClient();
