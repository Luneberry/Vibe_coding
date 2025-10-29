'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserConfig } from '@/lib/storage';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 설정이 있으면 채팅으로, 없으면 설정으로
    const config = getUserConfig();
    if (config) {
      router.push('/chat');
    } else {
      router.push('/setup');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">로딩 중...</p>
      </div>
    </div>
  );
}
