import { useState, useCallback } from 'react';
import type { ChatMessage } from '../types';
import { apiClient } from '../api/client';

let messageIdCounter = 0;
function generateId(): string {
  return `msg_${Date.now()}_${++messageIdCounter}`;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
    };

    const assistantId = generateId();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setIsLoading(true);

    try {
      for await (const event of apiClient.streamChat(content.trim())) {
        switch (event.type) {
          case 'token':
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId
                  ? { ...m, content: m.content + event.content }
                  : m
              )
            );
            break;
          case 'sources':
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId
                  ? { ...m, sources: event.sources }
                  : m
              )
            );
            break;
          case 'done':
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId
                  ? { ...m, isStreaming: false }
                  : m
              )
            );
            break;
          case 'error':
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId
                  ? {
                      ...m,
                      content: `Error: ${event.message}`,
                      isStreaming: false,
                    }
                  : m
              )
            );
            break;
        }
      }
    } catch (err) {
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? {
                ...m,
                content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      // Ensure streaming flag is cleared
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId ? { ...m, isStreaming: false } : m
        )
      );
    }
  }, [isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isLoading, sendMessage, clearMessages };
}
