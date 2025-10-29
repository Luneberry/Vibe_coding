'use client';

import React, { useState, useEffect } from "react";
import { Sun, Moon, Settings, Download } from "lucide-react";
import MemoSection from "../components/MemoSection";
import MeetingHistory, { Meeting } from "../components/MeetingHistory";
import dynamic from 'next/dynamic';

const AudioRecorder = dynamic(() => import('../components/AudioRecorder'), { ssr: false });

// Dummy data for meeting history
const dummyMeetings: Meeting[] = [
  {
    id: '1',
    title: '10월 20일 분기별 리뷰',
    date: '2025-10-20',
    summary: '프로젝트 A의 진행 상황이 계획대로 진행 중이며, 다음 분기에는 마케팅 전략에 집중해야 합니다. 주요 액션 아이템은 마케팅 팀과 협력하여 새로운 캠페인 초안을 작성하는 것입니다.',
    transcript: '회의를 시작하겠습니다. 먼저 프로젝트 A 진행 상황부터 공유 부탁드립니다. 네, 현재 계획대로 순조롭게 진행되고 있습니다. 다만 리소스가 약간 부족한 상황입니다...'
  },
  {
    id: '2',
    title: '10월 18일 신규 기능 브레인스토밍',
    date: '2025-10-18',
    summary: '사용자 경험 개선을 위한 몇 가지 아이디어가 논의되었습니다. 특히, 대시보드 위젯 커스터마이징 기능에 대한 긍정적인 반응이 많았습니다. 다음 단계로 프로토타입 제작을 고려해볼 수 있습니다.',
    transcript: '오늘 회의는 신규 기능에 대한 아이디어를 모으기 위해 마련되었습니다. 자유롭게 의견 공유해주세요. 저는 사용자가 대시보드 위젯을 직접 설정할 수 있는 기능이 있으면 좋겠습니다...'
  }
];

interface MemoItem {
  id: string;
  content: string;
  type: "text" | "list-item" | "checkbox" | "tag";
  timestamp?: Date;
  checked?: boolean;
}

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(false);
    const [savedMemos, setSavedMemos] = useState<MemoItem[]>([]);
    const [audioTranscript, setAudioTranscript] = useState("");
    const [finalizedTranscript, setFinalizedTranscript] = useState("");
    const [summary, setSummary] = useState('');
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [summaryError, setSummaryError] = useState<string | null>(null);
    const [meetingTitle, setMeetingTitle] = useState("");
    const [participants, setParticipants] = useState("");
    const [meetings, setMeetings] = useState<Meeting[]>([]);
  
    useEffect(() => {
      const savedMeetings = localStorage.getItem('meetings');
      if (savedMeetings) {
        setMeetings(JSON.parse(savedMeetings));
      }
    }, []);
  
    const handleSaveMeeting = () => {
      if (!meetingTitle.trim() && !participants.trim() && !audioTranscript.trim() && !summary.trim()) {
        alert("저장할 내용이 없습니다.");
        return;
      }
  
      const newMeeting: Meeting = {
        id: new Date().toISOString(),
        title: meetingTitle,
        date: new Date().toLocaleDateString('ko-KR'),
        summary: summary,
        transcript: audioTranscript,
      };
  
      const updatedMeetings = [...meetings, newMeeting];
      setMeetings(updatedMeetings);
      localStorage.setItem('meetings', JSON.stringify(updatedMeetings));
  
      // Reset fields
      setMeetingTitle("");
      setParticipants("");
      setAudioTranscript("");
      setFinalizedTranscript("");
      setSummary("");
      setSavedMemos([]);
    };
  
    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  
    const handleSaveMemos = (memos: MemoItem[]) => {
      setSavedMemos(memos);
      console.log("메모가 저장되었습니다:", memos);
    };
  
    const handleRecordingStart = () => {
      setAudioTranscript("");
      setFinalizedTranscript("");
      setSummary('');
      setSummaryError(null);
    };
  
    const handleTranscriptChange = (data: { text: string; type: 'partial' | 'final' }) => {
      if (data.type === 'partial') {
        setAudioTranscript(finalizedTranscript + data.text);
      } else {
        const newFinalTranscript = finalizedTranscript + data.text + ' ';
        setFinalizedTranscript(newFinalTranscript);
        setAudioTranscript(newFinalTranscript);
      }
    };

  const handleGenerateSummary = async () => {
    const textToSummarize = audioTranscript + '\n\n' + savedMemos.map(m => m.content).join('\n');
    if (!textToSummarize.trim()) {
      // Don't show an error, just do nothing if there's no text.
      return;
    }

    setIsSummarizing(true);
    setSummaryError(null);
    setSummary('');

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSummarize }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '요약 생성에 실패했습니다.');
      }

      setSummary(data.summary);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      setSummaryError(errorMessage);
    } finally {
      setIsSummarizing(false);
    }
  };

  const exportMemos = () => {
    // ... (export logic remains the same)
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? "dark bg-gray-900" : "bg-gray-50"}`}>
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        {/* ... (header JSX remains the same) ... */}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            <AudioRecorder 
              onRecordingStart={handleRecordingStart}
              onTranscriptChange={handleTranscriptChange}
              onRecordingStop={handleGenerateSummary} 
              audioTranscript={audioTranscript}
            />
            
            {/* 요약 결과 카드 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI 요약 결과</h3>
              {isSummarizing ? (
                <div className="flex justify-center items-center h-24">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : summaryError ? (
                <div className="text-red-500">오류: {summaryError}</div>
              ) : summary ? (
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{summary}</p>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">녹음을 중지하면 자동으로 회의 내용이 요약됩니다.</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">회의 정보</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="meeting-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">회의 제목</label>
                  <input
                    type="text"
                    id="meeting-title"
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="예: 3분기 마케팅 전략 회의"
                  />
                </div>
                <div>
                  <label htmlFor="participants" className="block text-sm font-medium text-gray-700 dark:text-gray-300">참석자</label>
                  <input
                    type="text"
                    id="participants"
                    value={participants}
                    onChange={(e) => setParticipants(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="예: 김민준, 이서연, 박도윤"
                  />
                </div>
                <button
                  onClick={handleSaveMeeting}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  회의 저장
                </button>
              </div>
            </div>

            <MemoSection onSave={handleSaveMemos} initialMemos={savedMemos} audioTranscript={audioTranscript} />

            <MeetingHistory meetings={meetings} />
          </div>
        </div>
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        {/* ... (footer JSX remains the same) ... */}
      </footer>
    </div>
  );
}