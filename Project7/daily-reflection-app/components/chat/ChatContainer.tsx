'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Message } from '@/types/message';
import { getLog, saveLog, getLogicalDate, getUserConfig, autoClearOldLogs } from '@/lib/storage';
import { generateId } from '@/lib/utils';
import { requestSummary } from '@/lib/api';
import MessageBubble from './MessageBubble';
import DateDivider from './DateDivider';
import InputBar from './InputBar';

export default function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [logicalDate, setLogicalDate] = useState(() => getLogicalDate(getUserConfig()));
  const [lastUploadDate, setLastUploadDate] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [bubbleColor, setBubbleColor] = useState('#3B82F6'); // 기본 색상

  // 앱 시작 시 오래된 로그 정리 (한 번만 실행)
  useEffect(() => {
    autoClearOldLogs();
  }, []);

  // 설정 로드 및 논리적 날짜에 따른 메시지 로드
  useEffect(() => {
    const config = getUserConfig();
    if (config?.bubbleColor) {
      setBubbleColor(config.bubbleColor);
    }
    
    // 현재 논리적 날짜에 해당하는 메시지 로드
    const log = getLog(logicalDate);
    setMessages(log);
    
    // 설정이 없으면 설정 페이지로 이동
    if (!config) {
      router.push('/setup');
    }
  }, [logicalDate, router]);

  // 논리적 날짜 변경 감지 (10초마다)
  useEffect(() => {
    const dateCheckInterval = setInterval(() => {
      const newLogicalDate = getLogicalDate(getUserConfig());
      if (newLogicalDate !== logicalDate) {
        setLogicalDate(newLogicalDate);
        setLastUploadDate(null); // 날짜가 바뀌면 업로드 상태 초기화
      }
    }, 10000); // 10초마다 체크

    return () => clearInterval(dateCheckInterval);
  }, [logicalDate]);

  // 자동 업로드 기능
  useEffect(() => {
    const config = getUserConfig();
    if (!config || !config.report_time) {
      return;
    }

    const checkAndUpload = async () => {
      const now = new Date();
      const [targetHour, targetMinute] = config.report_time.split(':').map(Number);

      // 리포트 시간이 되었는지 확인 (정확한 분까지)
      const isTargetTime = now.getHours() === targetHour && now.getMinutes() === targetMinute;
      
      // 어제의 논리적 날짜 계산 (경계 시간의 문제를 피하기 위해 1분 전 시간으로 계산)
      const refDate = new Date(now.getTime() - 60 * 1000); 
      const yesterdayLogicalDate = getLogicalDate(config, refDate);

      if (isTargetTime && lastUploadDate !== yesterdayLogicalDate && !isUploading) {
        const logToUpload = getLog(yesterdayLogicalDate);

        if (logToUpload.length === 0) {
          console.log('업로드할 메시지가 없어 건너뜁니다.');
          setLastUploadDate(yesterdayLogicalDate); // 업로드 시도했음을 기록
          return;
        }

        console.log('🚀 자동 업로드 시작:', yesterdayLogicalDate, '메시지 수:', logToUpload.length);
        setIsUploading(true);
        
        try {
          const progressMessage: Message = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            author: 'system',
            text: `💬 ${yesterdayLogicalDate} 하루가 마무리되었어요. n8n에서 요약을 진행하고 있습니다... (최대 1분 소요)`,
          };
          // 현재 화면에 진행 메시지 표시 (다음날 채팅에 보임)
          setMessages((prev) => [...prev, progressMessage]);

          const response = await requestSummary(yesterdayLogicalDate, logToUpload, config);

          const successMessage: Message = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            author: 'system',
            text: '✨ 요약이 완료되었습니다!',
            notionUrl: response.notion_url,
          };
          setMessages((prev) => [...prev, successMessage]);
          
          setLastUploadDate(yesterdayLogicalDate);
          console.log('✅ 자동 업로드 및 요약 완료!');

        } catch (error) {
          console.error('❌ 자동 업로드 실패:', error);
          const errorMessage: Message = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            author: 'system',
            text: `⚠️ 자동 업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
          };
          setMessages((prev) => [...prev, errorMessage]);
        } finally {
          setIsUploading(false);
        }
      }
    };

    const uploadCheckInterval = setInterval(checkAndUpload, 10000); // 10초마다 체크
    checkAndUpload(); // 마운트 시 즉시 체크

    return () => clearInterval(uploadCheckInterval);
  }, [lastUploadDate, isUploading]);

  // 메시지 변경 시 자동 저장
  useEffect(() => {
    // 초기 로드 시 빈 배열 저장을 방지
    if (messages.length > 0 || getLog(logicalDate).length > 0) {
      saveLog(logicalDate, messages);
    }
  }, [messages, logicalDate]);

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 수동 요약 요청 (현재 논리적 하루 기준)
  const handleManualSummary = async () => {
    const config = getUserConfig();
    if (!config) {
      alert('사용자 설정을 먼저 완료해주세요.');
      return;
    }
    if (isUploading) return;
    if (messages.length === 0) {
      alert('요약할 메시지가 없습니다.');
      return;
    }
    
    setIsUploading(true);
    console.log('📝 수동 요약 요청 시작:', logicalDate);
    
    try {
      const response = await requestSummary(logicalDate, messages, config);
      
      const systemMessage: Message = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        author: 'system',
        text: '✨ 요약이 완료되었습니다!',
        notionUrl: response.notion_url,
      };
      
      setMessages((prev) => [...prev, systemMessage]);
      console.log('✅ 수동 요약 완료:', response);
    } catch (error) {
      console.error('❌ 수동 요약 실패:', error);
      const errorMessage: Message = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        author: 'system',
        text: `⚠️ 요약 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = (text: string) => {
    const config = getUserConfig();
    const currentLogicalDate = getLogicalDate(config);

    const newMessage: Message = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      author: 'user',
      text,
    };

    // 메시지 보내는 순간 날짜가 바뀌었는지 체크
    if (currentLogicalDate !== logicalDate) {
      // 이전 날짜의 로그를 저장하고, 상태를 새 날짜로 업데이트
      saveLog(logicalDate, messages);
      setLogicalDate(currentLogicalDate);
      setMessages([newMessage]);
    } else {
      setMessages((prev) => [...prev, newMessage]);
    }
  };

  const handleGoToSettings = () => {
    router.push('/setup');
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* 헤더 */}
      <header className="flex-shrink-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              🧭 Daily Reflection
            </h1>
            {isUploading && (
              <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full animate-pulse">
                업로드 중...
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
              {logicalDate}
            </span>

            {/* 수동 요약 버튼 */}
            <button
              onClick={handleManualSummary}
              disabled={isUploading || messages.length === 0}
              className="px-3 py-1.5 text-sm text-white rounded-lg transition disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700"
              style={{ 
                backgroundColor: isUploading || messages.length === 0 ? '' : bubbleColor,
                filter: 'brightness(1)'
              }}
              onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(0.9)'}
              onMouseOut={(e) => e.currentTarget.style.filter = 'brightness(1)'}
              title="지금 바로 요약하기"
            >
              ✨ 요약
            </button>

            {/* 설정 버튼 */}
            <button
              onClick={handleGoToSettings}
              className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition"
              title="설정으로 이동"
            >
              ⚙️ 설정
            </button>
          </div>
        </div>
      </header>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-6" style={{ paddingBottom: '120px' }}>
        <div className="max-w-3xl mx-auto">
          <DateDivider date={logicalDate} />
          
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                오늘의 첫 기록을 시작해보세요
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                업무, 일상, 생각 등 무엇이든 자유롭게 적어주세요
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} bubbleColor={bubbleColor} />
            ))
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 입력 영역 */}
      <InputBar onSendMessage={handleSendMessage} />
    </div>
  );
}
