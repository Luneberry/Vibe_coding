'use client';

import React, { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  CheckSquare,
  Hash,
  Save,
  Clock,
} from "lucide-react";

interface MemoItem {
  id: string;
  content: string;
  type: "text" | "list-item" | "checkbox" | "tag";
  timestamp?: Date;
  checked?: boolean;
}

interface MemoSectionProps {
  onSave?: (memos: MemoItem[]) => void;
  initialMemos?: MemoItem[];
  audioTranscript?: string;
}

export default function MemoSection({
  onSave,
  initialMemos = [],
  audioTranscript = "",
}: MemoSectionProps) {
  const [memos, setMemos] = useState<MemoItem[]>(initialMemos);
  const [currentInput, setCurrentInput] = useState("");
  const [activeFormatting, setActiveFormatting] = useState({
    bold: false,
    italic: false,
    underline: false,
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [time, setTime] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString("ko-KR"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSave = () => {
    if (onSave) onSave(memos);
    console.log("메모 저장됨:", memos);
  };

  const addMemo = (type: MemoItem["type"] = "text", content?: string) => {
    const memoContent = content ?? currentInput.trim();
    if (!memoContent) return;
    const newMemo: MemoItem = {
      id: Date.now().toString(),
      content: memoContent,
      type,
      timestamp: new Date(),
    };
    setMemos((prev) => [...prev, newMemo]);
    setCurrentInput("");
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleInputChange = (value: string) => {
    setCurrentInput(value);
    if (value.includes("#")) {
      const tagMatch = value.match(/#(Action|Decision|Risk|Important|FollowUp)\b/i);
      if (tagMatch) {
        const tagName = tagMatch[1];
        setCurrentInput(value.replace(/#\w+/i, ""));
        addMemo("tag", tagName);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addMemo();
    }
  };

  const deleteMemo = (id: string) => {
    setMemos((prev) => prev.filter((memo) => memo.id !== id));
  };

  const toggleCheckbox = (id: string) => {
    setMemos((prev) =>
      prev.map((memo) => (memo.id === id ? { ...memo, checked: !memo.checked } : memo))
    );
  };

  const applyFormatting = (format: "bold" | "italic" | "underline") => {
    setActiveFormatting((prev) => ({ ...prev, [format]: !prev[format] }));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">회의 메모</h2>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">{time}</span>
        </div>
      </div>

      <div className="flex items-center space-x-2 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <button onClick={() => applyFormatting("bold")} className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${activeFormatting.bold ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300'}`} title="굵게 (Ctrl+B)"><Bold className="w-4 h-4" /></button>
        <button onClick={() => applyFormatting("italic")} className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${activeFormatting.italic ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300'}`} title="기울임 (Ctrl+I)"><Italic className="w-4 h-4" /></button>
        <button onClick={() => applyFormatting("underline")} className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${activeFormatting.underline ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300'}`} title="밑줄 (Ctrl+U)"><Underline className="w-4 h-4" /></button>
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
        <button onClick={() => addMemo("list-item")} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300" title="목록 추가"><List className="w-4 h-4" /></button>
        <button onClick={() => addMemo("checkbox")} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300" title="체크박스 추가"><CheckSquare className="w-4 h-4" /></button>
        <button onClick={() => addMemo("tag")} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300" title="태그 추가"><Hash className="w-4 h-4" /></button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <textarea ref={textareaRef} value={currentInput} onChange={(e) => handleInputChange(e.target.value)} onKeyDown={handleKeyDown} placeholder="회의 내용을 입력하세요... (Enter로 추가)" className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
        </div>
        <div className="flex justify-between items-center mt-3">
          <div className="flex space-x-2">
            <button onClick={() => addMemo()} disabled={!currentInput.trim()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium">메모 추가</button>
            <button onClick={() => setCurrentInput("")} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg text-sm">지우기</button>
          </div>
          <button onClick={handleSave} className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"><Save className="w-4 h-4" /><span>저장</span></button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">작성된 메모 및 스크립트</h3>
        {memos.length === 0 && !audioTranscript ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>녹음 버튼을 눌러 음성 인식을 시작하세요.</p>
            <p className="text-sm mt-1">또는 위 입력창에서 직접 메모를 작성할 수 있습니다.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {audioTranscript && (
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{audioTranscript}</p>
              </div>
            )}
            {memos.map((memo) => (
              <div key={memo.id} className={`p-4 rounded-lg border transition-all hover:shadow-md ${memo.type === "tag" ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700" : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {memo.type === "checkbox" ? (
                      <div className="flex items-center space-x-3">
                        <button onClick={() => toggleCheckbox(memo.id)} className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${memo.checked ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                          {memo.checked && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        </button>
                        <span className={`flex-1 ${memo.checked ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>{memo.content}</span>
                      </div>
                    ) : memo.type === "list-item" ? (
                      <div className="flex items-start space-x-3">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-gray-900 dark:text-white">{memo.content}</span>
                      </div>
                    ) : memo.type === "tag" ? (
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-medium">#{memo.content.replace("#", "")}</span>
                        <span className="text-gray-900 dark:text-white">{memo.content}</span>
                      </div>
                    ) : (
                      <span className="text-gray-900 dark:text-white">{memo.content}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {memo.timestamp && <span className="text-xs text-gray-500 dark:text-gray-400">{formatTime(memo.timestamp)}</span>}
                    <button onClick={() => deleteMemo(memo.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors text-sm">삭제</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">💡 사용 팁</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs">Enter</kbd> 키로 메모 추가</li>
          <li>• <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs">#Action</kbd>, <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs">#Decision</code> 태그 자동 변환</li>
        </ul>
      </div>
    </div>
  );
}