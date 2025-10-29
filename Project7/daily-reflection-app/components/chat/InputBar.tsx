'use client';

import { useState, useRef, KeyboardEvent } from 'react';

interface InputBarProps {
  onSendMessage: (text: string) => void;
}

export default function InputBar({ onSendMessage }: InputBarProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!message.trim()) return;
    
    onSendMessage(message.trim());
    setMessage('');
    
    // textarea 높이 초기화
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 p-4">
      <div className="max-w-3xl mx-auto flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="오늘 있었던 일이나 생각을 자유롭게 기록하세요..."
          rows={1}
          className="flex-1 px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition"
          style={{ maxHeight: '200px' }}
        />
        
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-full transition duration-200 ease-in-out transform hover:scale-110 active:scale-95 disabled:transform-none disabled:cursor-not-allowed"
          aria-label="전송"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>
      
      <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
        Enter로 전송 · Shift+Enter로 줄바꿈
      </p>
    </div>
  );
}
