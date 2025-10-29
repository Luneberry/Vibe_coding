'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserConfig } from '@/lib/storage';
import ChatContainer from '@/components/chat/ChatContainer';

export default function ChatPage() {
  const router = useRouter();

  useEffect(() => {
    // 설정이 없으면 설정 페이지로 리다이렉트
    const config = getUserConfig();
    if (!config) {
      router.push('/setup');
    }
  }, [router]);

  return <ChatContainer />;
}
