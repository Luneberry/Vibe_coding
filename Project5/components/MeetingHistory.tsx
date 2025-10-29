'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export interface Meeting {
  id: string;
  title: string;
  date: string;
  transcript: string;
  summary: string;
}

interface MeetingHistoryProps {
  meetings: Meeting[];
}

const MeetingHistory: React.FC<MeetingHistoryProps> = ({ meetings }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpansion = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">이전 회의 기록</h3>
      {meetings.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">저장된 회의 기록이 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <div key={meeting.id} className="border border-gray-200 dark:border-gray-700 rounded-lg">
              <button
                onClick={() => toggleExpansion(meeting.id)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900 dark:text-white">{meeting.title}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{meeting.date}</span>
                </div>
                {expandedId === meeting.id ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {expandedId === meeting.id && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">요약</h4>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm">{meeting.summary}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">전체 스크립트</h4>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm max-h-40 overflow-y-auto">{meeting.transcript}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MeetingHistory;
