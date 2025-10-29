import { ConfigValidation } from '@/types/config';

/**
 * 사용자 설정 유효성 검사
 */
export function validateConfig(
  name: string,
  notionKey: string,
  notionDb: string,
  reportTime: string
): ConfigValidation {
  const errors: ConfigValidation['errors'] = {};
  
  // 이름 검증
  if (!name || name.trim().length === 0) {
    errors.name = '이름을 입력해주세요';
  }
  
  // Notion Key 검증
  if (!notionKey || !notionKey.startsWith('ntn_')) {
    errors.notion_key = 'Notion API Key는 "ntn_"으로 시작해야 합니다';
  }
  
  // Notion DB ID 검증 (32자 영숫자)
  if (!notionDb || !/^[a-zA-Z0-9]{32}$/.test(notionDb.replace(/-/g, ''))) {
    errors.notion_db = 'Notion Database ID 형식이 올바르지 않습니다 (32자 영숫자)';
  }
  
  // 시간 형식 검증 (HH:mm)
  const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
  if (!reportTime || !timeRegex.test(reportTime)) {
    errors.report_time = '시간 형식이 올바르지 않습니다 (예: 22:00)';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * 시간 포맷팅 (HH:mm)
 */
export function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 날짜 포맷팅 (YYYY년 MM월 DD일)
 */
export function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split('-');
  return `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`;
}

/**
 * 고유 ID 생성
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
