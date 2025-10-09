'use client';

import clsx from 'clsx';
import { PERIOD_LABELS } from '../lib/format';
import type { CandlePeriod } from '../types/stock';

interface PeriodTabsProps {
  periods: CandlePeriod[];
  active: CandlePeriod;
  onChange: (period: CandlePeriod) => void;
}

const LABEL_FALLBACK: Record<string, string> = {
  dayCandle: '일봉',
  weekCandle: '주봉',
  monthCandle: '월봉',
};

export function PeriodTabs({ periods, active, onChange }: PeriodTabsProps) {
  return (
    <div className="inline-flex rounded-full bg-slate-900/80 border border-slate-800 p-1">
      {periods.map((period) => {
        const label = PERIOD_LABELS[period] ?? LABEL_FALLBACK[period] ?? period;
        const selected = period === active;
        return (
          <button
            key={period}
            type="button"
            onClick={() => onChange(period)}
            className={clsx(
              'px-4 py-2 text-sm font-medium rounded-full transition',
              selected
                ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/30'
                : 'text-slate-300 hover:text-slate-100'
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
