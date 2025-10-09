'use client';

import { useState } from 'react';

interface SearchFormProps {
  initialCode: string;
  onSubmit: (code: string) => void;
  loading?: boolean;
}

export function SearchForm({ initialCode, onSubmit, loading }: SearchFormProps) {
  const [value, setValue] = useState(initialCode);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full flex flex-col md:flex-row gap-3 md:items-center"
      aria-label="종목 검색 폼"
    >
      <div className="flex-1 flex items-center gap-3 bg-slate-900/70 border border-slate-700/60 rounded-2xl px-4 py-3">
        <span className="text-sm text-slate-400">종목 코드</span>
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="예: 005930"
          className="flex-1 bg-transparent border-none text-base text-slate-100 focus:outline-none"
          aria-label="종목 코드 입력"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-3 rounded-2xl bg-emerald-500/90 hover:bg-emerald-400 transition text-slate-950 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? '불러오는 중...' : '검색'}
      </button>
    </form>
  );
}
