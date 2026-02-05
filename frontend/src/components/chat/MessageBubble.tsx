import type { ChatMessage } from '../../types';
import { StreamingText } from './StreamingText';
import { SourceCard } from './SourceCard';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div className="flex items-center gap-2 mb-1">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              isUser
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {isUser ? 'U' : 'V'}
          </div>
          <span className="text-xs text-gray-500">
            {isUser ? 'You' : 'VCA'}
          </span>
        </div>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-primary-600 text-white rounded-tr-md'
              : 'bg-white text-gray-800 border border-gray-200 rounded-tl-md shadow-sm'
          }`}
        >
          {message.role === 'assistant' ? (
            <StreamingText
              content={message.content}
              isStreaming={message.isStreaming || false}
            />
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-xs text-gray-500 font-medium ml-1">Sources:</p>
            {message.sources.map((source, i) => (
              <SourceCard key={i} source={source} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
