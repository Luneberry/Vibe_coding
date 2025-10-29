'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserConfig } from '@/types/config';
import { validateConfig } from '@/lib/utils';
import { saveUserConfig, getUserConfig } from '@/lib/storage';

const defaultConfig: UserConfig = {
  name: '',
  notion_key: '',
  notion_db: '',
  report_time: '22:00',
  bubbleColor: '#3B82F6', // 기본 색상
};

export default function SetupForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<UserConfig>(defaultConfig);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedConfig = getUserConfig();
    if (savedConfig) {
      // 저장된 설정에 bubbleColor가 없으면 기본값으로 설정
      setFormData({ ...defaultConfig, ...savedConfig });
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateConfig(
      formData.name,
      formData.notion_key,
      formData.notion_db,
      formData.report_time
    );

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsLoading(true);

    try {
      const config: UserConfig = {
        name: formData.name.trim(),
        notion_key: formData.notion_key.trim(),
        notion_db: formData.notion_db.trim().replace(/-/g, ''),
        report_time: formData.report_time,
        bubbleColor: formData.bubbleColor,
      };

      saveUserConfig(config);
      router.push('/chat');
    } catch (error) {
      console.error('Setup failed:', error);
      setErrors({ submit: '설정 저장에 실패했습니다. 다시 시도해주세요.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🧭 설정
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Notion 연동 및 요약 시간을 설정합니다
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 이름 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              이름
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="홍길동"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Notion API Key */}
          <div>
            <label htmlFor="notion_key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notion API Key
            </label>
            <input
              type="password"
              id="notion_key"
              name="notion_key"
              value={formData.notion_key}
              onChange={handleChange}
              placeholder="기존 키는 변경 시에만 입력하세요"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
            {errors.notion_key && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.notion_key}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Notion Integration에서 발급받은 API Key를 입력하세요
            </p>
          </div>

          {/* Notion Database ID */}
          <div>
            <label htmlFor="notion_db" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notion Database ID
            </label>
            <input
              type="text"
              id="notion_db"
              name="notion_db"
              value={formData.notion_db}
              onChange={handleChange}
              placeholder="a1b2c3d4e5f6g7h8..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-mono text-sm"
            />
            {errors.notion_db && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.notion_db}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Notion 데이터베이스 URL에서 ID 부분을 복사하세요
            </p>
          </div>

          {/* 리포트 시간 */}
          <div>
            <label htmlFor="report_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              하루 요약 시간
            </label>
            <input
              type="time"
              id="report_time"
              name="report_time"
              value={formData.report_time}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
            {errors.report_time && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.report_time}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              매일 이 시간에 자동으로 하루를 요약합니다
            </p>
          </div>

          {/* 말풍선 색상 */}
          <div>
            <label htmlFor="bubbleColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              말풍선 색상
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="bubbleColor"
                name="bubbleColor"
                value={formData.bubbleColor || '#3B82F6'}
                onChange={handleChange}
                className="w-12 h-12 p-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 cursor-pointer"
              />
              <input
                type="text"
                value={formData.bubbleColor || '#3B82F6'}
                onChange={handleChange}
                name="bubbleColor"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-mono"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              채팅창에서 사용할 나만의 말풍선 색상을 선택하세요.
            </p>
          </div>

          {/* 제출 버튼 */}
          {errors.submit && (
            <p className="text-sm text-red-600 dark:text-red-400 text-center">{errors.submit}</p>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none disabled:cursor-not-allowed"
          >
            {isLoading ? '저장 중...' : '저장하기'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          설정은 브라우저에 안전하게 저장됩니다
        </p>
      </div>
    </div>
  );
}
