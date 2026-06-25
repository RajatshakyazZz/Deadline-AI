import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Copy, Check } from 'lucide-react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatMessageProps {
  message?: Message;
  isTyping?: boolean;
}

// Simple and highly robust Regex-based Markdown parser
export function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    // Check if it's a bullet point
    const bulletMatch = line.match(/^[-*+]\s+(.*)/);
    if (bulletMatch) {
      return (
        <ul key={lineIdx} className="list-disc list-inside ml-2 my-1 space-y-1">
          <li>{parseInlineMarkdown(bulletMatch[1])}</li>
        </ul>
      );
    }
    return (
      <p key={lineIdx} className="mb-2 leading-relaxed break-words last:mb-0">
        {parseInlineMarkdown(line)}
      </p>
    );
  });
}

// Parse inline **bold**, *italic*, and `code`
function parseInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let currentText = text;
  let keyIdx = 0;

  // Pattern matches code, bold, italic
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const matches = text.match(pattern);

  if (!matches) {
    return [text];
  }

  const splits = text.split(pattern);
  return splits.map((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className="bg-white/10 text-cyan-300 font-mono text-xs px-1.5 py-0.5 rounded border border-white/5 mx-0.5"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={idx} className="italic text-gray-200">{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isTyping = false }) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopy = () => {
    if (!message) return;
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render Typing Indicator
  if (isTyping) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-start mb-4 max-w-[85%]"
      >
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl rounded-bl-sm p-4 flex items-center space-x-1.5">
          {[0, 0.15, 0.3].map((delay, idx) => (
            <motion.span
              key={idx}
              className="w-2.5 h-2.5 bg-blue-400 rounded-full inline-block"
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: delay,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </motion.div>
    );
  }

  if (!message) return null;

  const isUser = message.role === 'user';
  const displayContent = message.content;
  const isLongMessage = displayContent.length > 200;
  const truncatedText = isLongMessage && !isExpanded 
    ? displayContent.slice(0, 190) + '...' 
    : displayContent;

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`group relative flex flex-col mb-4 ${isUser ? 'items-end' : 'items-start'}`}
    >
      <div className={`relative flex max-w-[85%] ${isUser ? 'justify-end' : 'justify-start'}`}>
        {/* Message bubble */}
        <div
          id={`chat-bubble-${message.id}`}
          className={`relative p-3.5 px-4 text-sm transition-all shadow-md ${
            isUser
              ? 'bg-gradient-to-br from-blue-400 to-purple-500 text-white rounded-2xl rounded-br-sm max-w-[85%]'
              : 'bg-white/5 border border-white/10 border-t-white/20 backdrop-blur-lg text-gray-100 rounded-2xl rounded-bl-sm max-w-[90%]'
          }`}
        >
          {/* Content */}
          <div className="whitespace-pre-line leading-relaxed">
            {isUser ? (
              displayContent
            ) : (
              <div>
                {renderMarkdown(truncatedText)}
                
                {isLongMessage && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-blue-400 hover:text-blue-300 font-medium text-xs mt-1 block cursor-pointer"
                  >
                    {isExpanded ? 'Show less ─' : 'Read more 💬'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Copy Button on Hover */}
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md bg-black/40 hover:bg-black/60 text-gray-300 hover:text-white cursor-pointer"
            title="Copy message"
          >
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          </button>
        </div>
      </div>

      {/* Timestamp */}
      <span className="text-[10px] text-gray-600 mt-1 mx-1.5 font-mono select-none">
        {message.timestamp}
      </span>
    </motion.div>
  );
};
