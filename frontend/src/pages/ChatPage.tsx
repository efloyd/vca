import { useState } from 'react';
import { ChatContainer } from '../components/chat/ChatContainer';
import { Sidebar } from '../components/shared/Sidebar';
import { useChat } from '../hooks/useChat';

export function ChatPage() {
  const { messages, isLoading, sendMessage } = useChat();
  const [pendingMessage, setPendingMessage] = useState<string | undefined>();

  const handleSuggestionClick = (text: string) => {
    setPendingMessage(text);
  };

  const handleSend = (message: string) => {
    setPendingMessage(undefined);
    sendMessage(message);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar onSuggestionClick={handleSuggestionClick} />
      <main className="flex-1 flex flex-col min-w-0">
        <ChatContainer
          messages={messages}
          isLoading={isLoading}
          onSend={handleSend}
          pendingMessage={pendingMessage}
        />
      </main>
    </div>
  );
}
