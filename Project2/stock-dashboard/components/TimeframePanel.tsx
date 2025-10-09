'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import type { ApexOptions } from 'apexcharts';
import type { PeriodDataset } from '@/types/stock';
import { formatDate, formatNumber, PERIOD_LABELS } from '@/lib/format';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface TimeframePanelProps {
  dataset: PeriodDataset;
}

export function TimeframePanel({ dataset }: TimeframePanelProps) {
  const label = PERIOD_LABELS[dataset.period] ?? dataset.label;

  const { options, series } = useMemo(() => {
    const candles = dataset.candles;
    const candlestickSeries = candles.map((candle) => ({
      x: candle.timestamp,
      y: [candle.open, candle.high, candle.low, candle.close],
    }));
    const volumeSeries = candles.map((candle) => ({
      x: candle.timestamp,
      y: candle.volume,
      fillColor: candle.close >= candle.open ? '#22c55e' : '#ef4444',
    }));

    const options: ApexOptions = {
      chart: {
        type: 'candlestick',
        background: 'transparent',
        animations: { enabled: false },
        toolbar: {
          show: true,
          tools: {
            download: false,
          },
        },
        fontFamily: 'inherit',
      },
      theme: { mode: 'dark' },
      grid: {
        borderColor: 'rgba(148, 163, 184, 0.25)',
        strokeDashArray: 4,
      },
      tooltip: {
        shared: true,
        x: { format: 'yyyy-MM-dd' },
        y: {
          formatter(value, { seriesIndex }) {
            if (seriesIndex === 0 && Array.isArray(value)) {
              const [open, high, low, close] = value as unknown as number[];
              return `시가 ${formatNumber(open)} / 고가 ${formatNumber(high)} / 저가 ${formatNumber(low)} / 종가 ${formatNumber(close)}`;
            }
            return `${formatNumber(Number(value))}`;
          },
        },
      },
      plotOptions: {
        candlestick: {
          colors: {
            upward: '#22c55e',
            downward: '#ef4444',
          },
        },
      },
      xaxis: {
        type: 'datetime',
        labels: {
          style: {
            colors: '#94a3b8',
          },
        },
      },
      yaxis: [
        {
          seriesName: '가격',
          labels: { style: { colors: '#94a3b8' } },
          tooltip: { enabled: true },
        },
        {
          seriesName: '거래량',
          opposite: true,
          labels: { style: { colors: '#94a3b8' } },
        },
      ],
      legend: {
        labels: {
          colors: '#e2e8f0',
        },
      },
      dataLabels: { enabled: false },
    };

    return {
      options,
      series: [
        {
          name: '가격',
          type: 'candlestick',
          data: candlestickSeries,
        },
        {
          name: '거래량',
          type: 'column',
          data: volumeSeries,
        },
      ],
    };
  }, [dataset]);

  return (
    <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 lg:p-8 flex flex-col gap-4">
      <header className="flex flex-col lg:flex-row lg:items-center gap-2">
        <h2 className="text-xl font-semibold text-slate-50">{label} 차트</h2>
        <p className="text-sm text-slate-400">가격과 거래량을 함께 확인하세요.</p>
      </header>
      <div className="w-full">
        <ReactApexChart options={options} series={series} type="candlestick" height={420} />
      </div>
      <footer className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-slate-300">
        <span>표본 수: {dataset.candles.length.toLocaleString()}개</span>
        <span>최신 날짜: {formatDate(dataset.candles[dataset.candles.length - 1]?.date)}</span>
        <span>최고가: {formatNumber(Math.max(...dataset.candles.map((c) => c.high)))} 원</span>
        <span>최저가: {formatNumber(Math.min(...dataset.candles.map((c) => c.low)))} 원</span>
      </footer>
    </section>
  );
}
