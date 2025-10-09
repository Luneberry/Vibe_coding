'use client';

import { useEffect, useRef } from 'react';
import * as LightweightCharts from 'lightweight-charts';
import type {
  UTCTimestamp,
  Time,
  BusinessDay,
  CandlestickData,
} from 'lightweight-charts';
import { Candle } from '@/types';
import {
  ResponsiveContainer,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Area,
  CartesianGrid,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

interface ChartContainerProps {
  data: Candle[];
}

/* ---------------------- Recharts Custom Tooltip ---------------------- */

const CustomTooltip = (
  { active, payload, label }: TooltipProps<ValueType, NameType>
) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-4 bg-[var(--input-background)] border border-[var(--border-color)] rounded-lg shadow-lg">
        <p className="label text-sm font-bold text-white">{`Date: ${label}`}</p>
        {payload.map((pld, index) => {
          // 런타임-세이프 접근(타입 내 color/name/value는 선택적이라 가드)
          const color = (pld as { color?: string }).color;
          const name = String(pld?.name ?? '');
          const valueNum = Number(pld?.value ?? 0);
          return (
            <p key={index} style={{ color }}>
              {`${name}: ${valueNum.toLocaleString()}`}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

/* --------------------------- Formatters --------------------------- */

const formatPrice = (tick: number) => {
  if (tick >= 1e9) return `${(tick / 1e9).toFixed(1)}B`;
  if (tick >= 1e6) return `${(tick / 1e6).toFixed(1)}M`;
  if (tick >= 1e3) return `${(tick / 1e3).toFixed(1)}K`;
  return tick.toString();
};
const formatPercentage = (tick: number) => `${(tick * 100).toFixed(2)}%`;

/* ----------------------- Lightweight Candles ----------------------- */

const CandlestickChart = ({ data }: { data: Candle[] }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    const chart = LightweightCharts.createChart(chartContainerRef.current, {
      layout: {
        background: { type: LightweightCharts.ColorType.Solid, color: '#0A0A0A' },
        textColor: '#EDEDED',
      },
      localization: {
        timeFormatter: (t: Time) => {
          if (typeof t === 'number') {
            const date = new Date(t * 1000);
            const yy = String(date.getFullYear()).slice(-2);
            const mm = date.getMonth() + 1;
            const dd = date.getDate();
            return `${yy}년 ${mm}월 ${dd}일`;
          }
          const { year, month, day } = t as BusinessDay;
          const yy = String(year).slice(-2);
          return `${yy}년 ${month}월 ${day}일`;
        },
      },
      grid: { vertLines: { color: '#2A2A2A' }, horzLines: { color: '#2A2A2A' } },
      crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    });

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderDownColor: '#ef5350',
      borderUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      wickUpColor: '#26a69a',
    });

    const candleData: CandlestickData[] = data.map((d) => ({
      time: Math.floor(new Date(d.candle_date_time_utc).getTime() / 1000) as UTCTimestamp,
      open: d.opening_price,
      high: d.high_price,
      low: d.low_price,
      close: d.trade_price,
    }));

    candlestickSeries.setData(candleData);
    chart.timeScale().fitContent();

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  return (
    <div className="w-full border border-[var(--border-color)] rounded-lg bg-[var(--card-background)] p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Candlestick Chart (KRW)</h3>
      <div ref={chartContainerRef} style={{ height: '400px', width: '100%' }} />
    </div>
  );
};

/* ---------------------------- Container ---------------------------- */

export default function ChartContainer({ data }: ChartContainerProps) {
  const formattedData = data.map((d) => ({
    ...d,
    date: d.candle_date_time_kst.substring(5, 10), // MM-DD
  }));

  return (
    <div className="w-full flex flex-col gap-8">
      <CandlestickChart data={data} />

      {/* Price Chart */}
      <div className="w-full h-80 p-4 border border-[var(--border-color)] rounded-lg bg-[var(--card-background)]">
        <h3 className="text-lg font-semibold text-white mb-2">Price (KRW)</h3>
        <ResponsiveContainer width="100%" height="90%">
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
            <YAxis
              stroke="#9CA3AF"
              fontSize={12}
              tickFormatter={formatPrice}
              domain={['dataMin - 1000', 'dataMax + 1000']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="trade_price"
              name="Price"
              stroke="#8884d8"
              fillOpacity={1}
              fill="url(#colorPrice)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Volume Chart */}
      <div className="w-full h-80 p-4 border border-[var(--border-color)] rounded-lg bg-[var(--card-background)]">
        <h3 className="text-lg font-semibold text-white mb-2">Volume</h3>
        <ResponsiveContainer width="100%" height="90%">
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
            <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={formatPrice} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="candle_acc_trade_volume"
              name="Volume"
              stroke="#82ca9d"
              fillOpacity={1}
              fill="url(#colorVolume)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Change Rate Chart */}
      <div className="w-full h-80 p-4 border border-[var(--border-color)] rounded-lg bg-[var(--card-background)]">
        <h3 className="text-lg font-semibold text-white mb-2">Change Rate (%)</h3>
        <ResponsiveContainer width="100%" height="90%">
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id="colorChange" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffc658" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ffc658" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
            <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={formatPercentage} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="change_rate"
              name="Change Rate"
              stroke="#ffc658"
              fillOpacity={1}
              fill="url(#colorChange)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
