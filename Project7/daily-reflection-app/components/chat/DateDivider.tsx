'use client';

import { formatDate } from '@/lib/utils';

interface DateDividerProps {
  date: string; // "YYYY-MM-DD"
}

export default function DateDivider({ date }: DateDividerProps) {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
      <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
        {formatDate(date)}
      </span>
      <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
    </div>
  );
}
