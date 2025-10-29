import { UserConfig } from '@/types/config';
import { Message, SessionLog } from '@/types/message';

const STORAGE_KEYS = {
  USER_CONFIG: 'userConfig',
  SESSION_LOGS: 'sessionLogs',
} as const;

// 사용자 설정 저장/불러오기
export function saveUserConfig(config: UserConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.USER_CONFIG, JSON.stringify(config));
}

export function getUserConfig(): UserConfig | null {
  if (typeof window === 'undefined') return null;
  
  const data = localStorage.getItem(STORAGE_KEYS.USER_CONFIG);
  if (!data) return null;
  
  try {
    return JSON.parse(data) as UserConfig;
  } catch (error) {
    console.error('Failed to parse user config:', error);
    return null;
  }
}

// Date 객체를 YYYY-MM-DD 형식의 문자열로 변환
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 사용자가 설정한 시간을 기준으로 "논리적 날짜"를 계산
export function getLogicalDate(
  config: UserConfig | null,
  refDate: Date = new Date()
): string {
  const reportTime = config?.report_time || '00:00';
  const [hour, minute] = reportTime.split(':').map(Number);

  // 기준 날짜(refDate)를 복사하여 사용
  const date = new Date(refDate.getTime());

  // 기준 날짜의 시간에 reportTime 설정
  const reportDateTime = new Date(date.getTime());
  reportDateTime.setHours(hour, minute, 0, 0);

  // 기준 시각이 리포트 시간보다 이전이라면, 논리적 날짜는 하루 전임
  if (date < reportDateTime) {
    date.setDate(date.getDate() - 1);
  }

  return formatDate(date);
}

// 모든 로그 가져오기
function getAllLogs(): Record<string, Message[]> {
  if (typeof window === 'undefined') return {};
  
  const data = localStorage.getItem(STORAGE_KEYS.SESSION_LOGS);
  if (!data) return {};
  
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to parse session logs:', error);
    return {};
  }
}

// 모든 로그 저장하기
function saveAllLogs(logs: Record<string, Message[]>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SESSION_LOGS, JSON.stringify(logs));
}

// 특정 날짜의 로그 저장
export function saveLog(date: string, messages: Message[]): void {
  const allLogs = getAllLogs();
  allLogs[date] = messages;
  saveAllLogs(allLogs);
}

// 특정 날짜의 로그 가져오기
export function getLog(date: string): Message[] {
  const allLogs = getAllLogs();
  return allLogs[date] || [];
}

// 모든 로그 내보내기
export function exportAllLogs(): Record<string, Message[]> {
  return getAllLogs();
}

const LOG_RETENTION_DAYS = 14; // 데이터 보관 기간 (일)

// 오래된 로그 삭제
function clearOldLogs(): void {
  const allLogs = getAllLogs();
  const today = new Date();
  
  // 보관 기간 이전의 날짜를 계산
  const cutoffDate = new Date(today.getTime() - LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  
  const filteredLogs: Record<string, Message[]> = {};
  let clearedCount = 0;
  
  Object.entries(allLogs).forEach(([date, messages]) => {
    // 로그 날짜가 보관 기준일 이후인 경우에만 유지
    const logDate = new Date(date);
    if (logDate >= cutoffDate) {
      filteredLogs[date] = messages;
    } else {
      clearedCount++;
    }
  });
  
  // 변경된 경우에만 저장
  if (clearedCount > 0) {
    saveAllLogs(filteredLogs);
    console.log(`🧹 ${clearedCount}일 분량의 오래된 로그를 정리했습니다.`);
  }
}

// 앱 시작 시 오래된 로그를 자동으로 정리하는 함수
export function autoClearOldLogs(): void {
  if (typeof window === 'undefined') return;
  
  // DB 마이그레이션을 대비해 이 함수만 호출하면 되도록 캡슐화
  clearOldLogs();
}
