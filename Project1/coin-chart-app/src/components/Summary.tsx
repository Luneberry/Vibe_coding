'use client';

import { Candle } from '@/types';
import { useMemo } from 'react';

interface SummaryProps {
  data: Candle[];
}

const StatCard = ({ title, value, valueClass }: { title: string; value: string; valueClass?: string }) => (
    <div className="bg-[var(--background)] border border-[var(--border-color)] p-4 rounded-lg text-center flex flex-col justify-center min-h-full">
        <h4 className="text-sm font-medium text-gray-300 mb-1">{title}</h4>
        <p className={`text-lg sm:text-xl font-semibold ${valueClass || 'text-white'}`}>{value}</p>
    </div>
);

export default function Summary({ data }: SummaryProps) {
  const summary = useMemo(() => {
    if (!data || data.length === 0) return null;

    const firstDay = data[0];
    const lastDay = data[data.length - 1];

    let periodHigh = 0;
    let periodLow = Infinity;
    let totalVolume = 0;
    let highestVolumeDay = firstDay;

    data.forEach(day => {
      if (day.high_price > periodHigh) periodHigh = day.high_price;
      if (day.low_price < periodLow) periodLow = day.low_price;
      totalVolume += day.candle_acc_trade_volume;
      if (day.candle_acc_trade_volume > highestVolumeDay.candle_acc_trade_volume) {
        highestVolumeDay = day;
      }
    });

    const overallReturn = (lastDay.trade_price - firstDay.opening_price) / firstDay.opening_price;

    return {
      startDate: firstDay.candle_date_time_kst.substring(0, 10),
      endDate: lastDay.candle_date_time_kst.substring(0, 10),
      periodHigh,
      periodLow,
      totalVolume,
      overallReturn,
      highestVolumeDay,
    };
  }, [data]);

  if (!summary) return null;

  const returnColor = summary.overallReturn >= 0 ? 'text-green-400' : 'text-red-400';

  return (
    <div className="w-full p-4 sm:p-6 border border-[var(--border-color)] rounded-lg bg-[var(--card-background)]">
      <h3 className="text-xl font-semibold text-white mb-4">기간 요약</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard 
            title="조회 기간" 
            value={`${summary.startDate} ~ ${summary.endDate}`} 
            valueClass="text-base sm:text-lg"
        />
        <StatCard 
            title="최고가" 
            value={`${summary.periodHigh.toLocaleString()} KRW`} 
        />
        <StatCard 
            title="최저가" 
            value={`${summary.periodLow.toLocaleString()} KRW`} 
        />
        <StatCard 
            title="기간 수익률" 
            value={`${(summary.overallReturn * 100).toFixed(2)}%`} 
            valueClass={returnColor}
        />
        <StatCard 
            title="총 거래량" 
            value={`${Math.round(summary.totalVolume).toLocaleString()}`} 
        />
      </div>
    </div>
  );
}
