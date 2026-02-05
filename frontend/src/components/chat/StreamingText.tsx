interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
}

export function StreamingText({ content, isStreaming }: StreamingTextProps) {
  return (
    <div className={`whitespace-pre-wrap ${isStreaming ? 'streaming-cursor' : ''}`}>
      {content || (isStreaming ? '' : 'Thinking...')}
    </div>
  );
}
