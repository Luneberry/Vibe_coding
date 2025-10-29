import { UserConfig } from '@/types/config';
import { Message } from '@/types/message';

const N8N_WEBHOOK_BASE = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || '';

interface SummaryResponse {
  success: boolean;
  notion_url: string;
  message: string;
  date: string;
  message_count: number;
}

/**
 * 수동 요약 요청
 * n8n webhook: POST /webhook/upload-log (동일한 엔드포인트 사용)
 */
export async function requestSummary(
  date: string,
  messages: Message[],
  config: UserConfig
): Promise<SummaryResponse> {
  if (!N8N_WEBHOOK_BASE) {
    throw new Error('N8N_WEBHOOK_URL이 설정되지 않았습니다. .env.local 파일을 확인해주세요.');
  }

  console.log('📤 n8n 요약 요청:', {
    url: `${N8N_WEBHOOK_BASE}/upload-log`,
    date,
    messageCount: messages.length,
    notionDb: config.notion_db.substring(0, 8) + '...'
  });

  try {
    const response = await fetch(`${N8N_WEBHOOK_BASE}/upload-log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date,
        messages,
        notion_key: config.notion_key,
        notion_db: config.notion_db,
      }),
      signal: AbortSignal.timeout(60000), // 60초 타임아웃
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`n8n 요청 실패 (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ n8n 응답:', data);
    
    return data as SummaryResponse;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        throw new Error('n8n 서버 응답 시간 초과 (1분). n8n 워크플로우를 확인해주세요.');
      } else if (error.message.includes('fetch')) {
        throw new Error('n8n 서버에 연결할 수 없습니다. URL을 확인해주세요: ' + N8N_WEBHOOK_BASE);
      }
    }
    console.error('Error requesting summary:', error);
    throw error;
  }
}

/**
 * 로그 파일 업로드 (자동 업로드용)
 * n8n webhook: POST /webhook/upload-log
 */
export async function uploadLog(
  date: string, 
  messages: Message[],
  config: UserConfig
): Promise<void> {
  if (!N8N_WEBHOOK_BASE) {
    console.warn('N8N_WEBHOOK_URL not configured');
    return;
  }

  console.log('📤 n8n 자동 업로드:', {
    url: `${N8N_WEBHOOK_BASE}/upload-log`,
    date,
    messageCount: messages.length,
    notionDb: config.notion_db.substring(0, 8) + '...'
  });

  try {
    const response = await fetch(`${N8N_WEBHOOK_BASE}/upload-log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date,
        messages,
        notion_key: config.notion_key,
        notion_db: config.notion_db,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`n8n 요청 실패 (${response.status}): ${errorText}`);
    }

    console.log('✅ n8n 자동 업로드 완료');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        throw new Error('n8n 서버에 연결할 수 없습니다. URL을 확인해주세요: ' + N8N_WEBHOOK_BASE);
      }
    }
    console.error('Error uploading log:', error);
    throw error;
  }
}
