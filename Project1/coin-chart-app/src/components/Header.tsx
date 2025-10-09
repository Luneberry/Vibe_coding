'use client';

import { useState } from 'react';

interface HeaderProps {
  onSearch: (date: string, period: string) => void;
  isLoading: boolean;
}

// Helper to get today's date in YYYY-MM-DD format
const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export default function Header({ onSearch, isLoading }: HeaderProps) {
  const [date, setDate] = useState(getTodayString());
  const [period, setPeriod] = useState('100');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(date, period);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full p-4 border border-[var(--border-color)] rounded-lg bg-[var(--card-background)]">
      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
        <div className="flex items-center gap-2">
          <label htmlFor="date" className="font-medium text-sm sm:text-base whitespace-nowrap">기준일</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-[var(--input-background)] border border-[var(--border-color)] rounded-md px-3 py-1.5 text-white focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none w-full max-w-xs"
            required
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="period" className="font-medium text-sm sm:text-base whitespace-nowrap">기간 (일)</label>
          <input
            id="period"
            type="number"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-[var(--input-background)] border border-[var(--border-color)] rounded-md px-3 py-1.5 w-24 text-white focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none"
            min="1"
            max="200" // Upbit API limit for days
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] disabled:bg-gray-500 text-white font-bold py-2 px-6 rounded-md transition-colors duration-200 focus:ring-2 focus:ring-blue-400 focus:outline-none w-full sm:w-auto"
        >
          {isLoading ? '조회중...' : '조회'}
        </button>
      </div>
    </form>
  );
}
