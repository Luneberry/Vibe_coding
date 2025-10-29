'use client';

import { useState } from 'react';
import { getUserConfig } from '@/lib/storage';
import { Message } from '@/types/message';

export default function WebhookTester() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // 🆕 환경 변수 표시 (빌드 타임에 주입됨)
  const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || '설정되지 않음';

  // 🆕 결과 초기화 함수
  const clearResult = () => {
    setTestResult('');
  };

  // 🆕 환경 변수 확인 함수
  const checkEnvVariables = () => {
    setTestResult('🔍 환경 변수 확인\n\n');
    setTestResult(prev => prev + `NEXT_PUBLIC_N8N_WEBHOOK_URL: ${webhookUrl}\n\n`);
    
    if (webhookUrl === '설정되지 않음') {
      setTestResult(prev => prev + '❌ Webhook URL이 설정되지 않았습니다!\n\n');
      setTestResult(prev => prev + '해결 방법:\n');
      setTestResult(prev => prev + '1. .env.local 파일 확인\n');
      setTestResult(prev => prev + '2. NEXT_PUBLIC_N8N_WEBHOOK_URL=https://modulabs.ddns.net/webhook\n');
      setTestResult(prev => prev + '3. 개발 서버 재시작 (npm run dev)\n');
    } else {
      setTestResult(prev => prev + '✅ Webhook URL이 올바르게 설정되었습니다!\n');
      setTestResult(prev => prev + `\n전체 업로드 URL: ${webhookUrl}/upload-log\n`);
    }
  };

  const testWebhookConnection = async () => {
    setIsLoading(true);
    setTestResult('테스트 중...\n');

    const config = getUserConfig();
    if (!config) {
      setTestResult('❌ 사용자 설정이 없습니다. Setup 페이지에서 먼저 설정해주세요.');
      setIsLoading(false);
      return;
    }

    if (!webhookUrl || webhookUrl === '설정되지 않음') {
      setTestResult('❌ N8N_WEBHOOK_URL이 설정되지 않았습니다.\n');
      setTestResult(prev => prev + '\n.env.local 파일을 확인하고 개발 서버를 재시작해주세요.\n');
      setTestResult(prev => prev + '\n필요한 설정:\n');
      setTestResult(prev => prev + 'NEXT_PUBLIC_N8N_WEBHOOK_URL=https://modulabs.ddns.net/webhook\n');
      setIsLoading(false);
      return;
    }

    setTestResult(prev => prev + `✅ Webhook URL: ${webhookUrl}\n`);
    setTestResult(prev => prev + `✅ Notion DB: ${config.notion_db.substring(0, 8)}...\n\n`);

    // 테스트 데이터 생성
    const testMessages: Message[] = [
      {
        id: 'test-1',
        timestamp: new Date().toISOString(),
        author: 'user',
        text: '테스트 메시지 1: 오늘 아침 회의가 있었어요.',
      },
      {
        id: 'test-2',
        timestamp: new Date().toISOString(),
        author: 'user',
        text: '테스트 메시지 2: 프로젝트 문서 작성 완료했습니다.',
      },
    ];

    const testData = {
      date: new Date().toISOString().split('T')[0],
      messages: testMessages,
      notion_db: config.notion_db,
    };

    setTestResult(prev => prev + '📤 n8n에 테스트 요청 전송 중...\n');
    setTestResult(prev => prev + `URL: ${webhookUrl}/upload-log\n`);
    setTestResult(prev => prev + `데이터: ${JSON.stringify(testData, null, 2)}\n\n`);

    try {
      const response = await fetch(`${webhookUrl}/upload-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
        signal: AbortSignal.timeout(30000),
      });

      setTestResult(prev => prev + `📥 응답 상태: ${response.status} ${response.statusText}\n`);

      if (!response.ok) {
        const errorText = await response.text();
        setTestResult(prev => prev + `❌ 에러 응답:\n${errorText}\n`);
        setIsLoading(false);
        return;
      }

      const responseData = await response.json();
      setTestResult(prev => prev + '✅ 성공!\n');
      setTestResult(prev => prev + `응답 데이터:\n${JSON.stringify(responseData, null, 2)}\n`);

      if (responseData.notion_url) {
        setTestResult(prev => prev + `\n🔗 Notion URL: ${responseData.notion_url}\n`);
      }

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          setTestResult(prev => prev + '❌ 타임아웃: n8n 서버가 30초 내에 응답하지 않았습니다.\n');
          setTestResult(prev => prev + '   - n8n이 실행 중인지 확인하세요.\n');
          setTestResult(prev => prev + '   - 워크플로우가 Active 상태인지 확인하세요.\n');
        } else if (error.message.includes('fetch')) {
          setTestResult(prev => prev + `❌ 연결 실패: ${webhookUrl}에 연결할 수 없습니다.\n`);
          setTestResult(prev => prev + '   - n8n이 실행 중인지 확인하세요.\n');
          setTestResult(prev => prev + '   - .env.local의 URL이 올바른지 확인하세요.\n');
        } else {
          setTestResult(prev => prev + `❌ 에러: ${error.message}\n`);
        }
      } else {
        setTestResult(prev => prev + `❌ 알 수 없는 에러: ${error}\n`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const testTimeCheck = () => {
    const config = getUserConfig();
    if (!config) {
      setTestResult('❌ 사용자 설정이 없습니다.');
      return;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    
    const [targetHour, targetMinute] = config.report_time.split(':').map(Number);
    const targetTime = config.report_time;

    const isTargetTime = currentHour === targetHour && currentMinute === targetMinute;

    setTestResult(`⏰ 시간 체크 테스트\n\n`);
    setTestResult(prev => prev + `현재 시간: ${currentTime}\n`);
    setTestResult(prev => prev + `설정 시간: ${targetTime}\n`);
    setTestResult(prev => prev + `매칭 여부: ${isTargetTime ? '✅ 일치!' : '❌ 불일치'}\n\n`);
    
    if (!isTargetTime) {
      const minutesUntilTarget = ((targetHour - currentHour) * 60 + (targetMinute - currentMinute));
      if (minutesUntilTarget < 0) {
        setTestResult(prev => prev + `다음 자동 업로드까지: 내일 ${targetTime}\n`);
      } else {
        const hours = Math.floor(minutesUntilTarget / 60);
        const mins = minutesUntilTarget % 60;
        setTestResult(prev => prev + `다음 자동 업로드까지: ${hours}시간 ${mins}분\n`);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          🔧 Webhook 연결 테스트
        </h2>
        
        {/* 🆕 현재 설정된 URL 표시 */}
        <div className="text-sm">
          <span className="text-gray-600 dark:text-gray-400">Webhook URL: </span>
          <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
            {webhookUrl}
          </code>
        </div>
      </div>
      
      <div className="space-y-4 mb-6">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-300">테스트 전 체크리스트</h3>
          <ul className="text-sm space-y-1 text-blue-800 dark:text-blue-400">
            <li>✓ n8n이 실행 중인가요? (https://modulabs.ddns.net)</li>
            <li>✓ 워크플로우가 Active 상태인가요?</li>
            <li>✓ .env.local에 NEXT_PUBLIC_N8N_WEBHOOK_URL이 설정되어 있나요?</li>
            <li>✓ Setup 페이지에서 초기 설정을 완료했나요?</li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* 🆕 환경 변수 확인 버튼 추가 */}
          <button
            onClick={checkEnvVariables}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
          >
            🔍 환경 변수 확인
          </button>

          <button
            onClick={testWebhookConnection}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition"
          >
            {isLoading ? '테스트 중...' : '🚀 Webhook 연결 테스트'}
          </button>
          
          <button
            onClick={testTimeCheck}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition"
          >
            ⏰ 시간 체크 테스트
          </button>

          <button
            onClick={clearResult}
            disabled={isLoading || !testResult}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white rounded-lg transition"
            title="결과 초기화"
          >
            🗑️ 초기화
          </button>
        </div>
      </div>

      {testResult && (
        <div className="relative">
          <button
            onClick={clearResult}
            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full transition z-10"
            title="닫기"
          >
            ✕
          </button>
          
          <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 pr-12 font-mono text-sm whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto">
            {testResult}
          </div>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
        <p className="font-semibold mb-2">💡 팁:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>🆕 환경 변수 확인: 현재 설정된 Webhook URL을 확인합니다</li>
          <li>Webhook 연결 테스트: n8n 서버와의 연결 및 데이터 전송을 테스트합니다</li>
          <li>시간 체크 테스트: 현재 시간과 설정 시간을 비교하여 자동 업로드 타이밍을 확인합니다</li>
          <li>초기화 버튼으로 테스트 결과를 지울 수 있습니다</li>
        </ul>
      </div>
    </div>
  );
}
