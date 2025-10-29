export interface Message {
  id: string;
  timestamp: string; // ISO 8601 형식
  author: 'user' | 'system';
  text: string;
  notionUrl?: string; // 시스템 메시지에만 존재
}

export interface SessionLog {
  date: string; // "YYYY-MM-DD" 형식
  messages: Message[];
}
