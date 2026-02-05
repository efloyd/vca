export interface SourceReference {
  document_name: string;
  chunk_text: string;
  relevance_score: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceReference[];
  isStreaming?: boolean;
}

export interface DocumentInfo {
  id: number;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  status: 'processing' | 'ready' | 'error';
  chunk_count: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface HealthInfo {
  status: string;
  document_count: number;
  chunk_count: number;
}

export type SSEEvent =
  | { type: 'token'; content: string }
  | { type: 'sources'; sources: SourceReference[] }
  | { type: 'done' }
  | { type: 'error'; message: string };
