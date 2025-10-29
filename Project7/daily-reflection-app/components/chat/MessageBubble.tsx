'use client';

import { Message } from '@/types/message';
import { formatTime } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  bubbleColor?: string;
}

export default function MessageBubble({ message, bubbleColor = '#3B82F6' }: MessageBubbleProps) {
  const isUser = message.author === 'user';
  const time = formatTime(new Date(message.timestamp));

  const userBubbleStyle = {
    backgroundColor: bubbleColor,
  };

  return (
    <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-2.5 rounded-2xl shadow-sm ${
            isUser
              ? 'text-white rounded-br-sm'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm'
          }`}
          style={isUser ? userBubbleStyle : {}}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.text}
          </p>
          
          {/* Notion 링크 (시스템 메시지에만) */}
          {!isUser && message.notionUrl && (
            <a
              href={message.notionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              🔗 노션에서 보기
            </a>
          )}
        </div>
        
        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">
          {time}
        </span>
      </div>
    </div>
  );
}
