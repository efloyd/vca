import { useRef, useEffect } from 'react';
import type { ChatMessage } from '../../types';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';

interface ChatContainerProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (message: string) => void;
  pendingMessage?: string;
}

export function ChatContainer({ messages, isLoading, onSend, pendingMessage }: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center
                              justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">VCA</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Virtual Compliance Assistant
              </h2>
              <p className="text-gray-500 max-w-md mx-auto">
                Ask questions about compliance policies, regulations, and firm procedures.
                All answers are sourced exclusively from uploaded documents.
              </p>
            </div>
          )}
          {messages.map(message => (
            <MessageBubble key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <ChatInput
        onSend={onSend}
        isLoading={isLoading}
        initialValue={pendingMessage}
      />
    </div>
  );
}
