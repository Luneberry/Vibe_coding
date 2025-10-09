'use client';

import { useEffect, useRef } from 'react';
import * as LightweightCharts from 'lightweight-charts';
import { Candle } from '@/types';
import {
  ResponsiveContainer,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Area,
  CartesianGrid
} from 'recharts';

interface ChartContainerProps {
  data: Candle[];
}

// Recharts Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-4 bg-[var(--input-background)] border border-[var(--border-color)] rounded-lg shadow-lg">
        <p className="label text-sm font-bold text-white">{`Date: ${label}`}</p>
        {payload.map((pld: any, index: number) => (
            <p key={index} style={{ color: pld.color }}>
                {`${pld.name}: ${pld.value.toLocaleString()}`}
            </p>
        ))}
      </div>
    );
  }
  return null;
};

// Recharts Formatters
const formatPrice = (tick: number) => {
    if (tick >= 1e9) return `${(tick / 1e9).toFixed(1)}B`;
    if (tick >= 1e6) return `${(tick / 1e6).toFixed(1)}M`;
    if (tick >= 1e3) return `${(tick / 1e3).toFixed(1)}K`;
    return tick.toString();
};
const formatPercentage = (tick: number) => `${(tick * 100).toFixed(2)}%`;


const CandlestickChart = ({ data }: { data: Candle[] }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chartContainerRef.current || data.length === 0) return;

        const handleResize = () => {
            chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
        };

        const chart = LightweightCharts.createChart(chartContainerRef.current, {
            layout: {
                background: { type: LightweightCharts.ColorType.Solid, color: '#0A0A0A' },
                textColor: '#EDEDED',
            },
            localization: {
                timeFormatter: (timestamp) => {
                    const date = new Date(timestamp * 1000);
                    const year = date.getFullYear().toString().slice(-2);
                    const month = date.getMonth() + 1;
                    const day = date.getDate();
                    return `${year}년 ${month}월 ${day}일`;
                },
            },
            grid: { vertLines: { color: '#2A2A2A' }, horzLines: { color: '#2A2A2A' } },
            crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
            width: chartContainerRef.current.clientWidth,
            height: 400,
        });

        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#26a69a', downColor: '#ef5350', borderDownColor: '#ef5350',
            borderUpColor: '#26a69a', wickDownColor: '#ef5350', wickUpColor: '#26a69a',
        });

        const candleData = data.map(d => ({
            time: (new Date(d.candle_date_time_utc).getTime() / 1000) as any,
            open: d.opening_price, high: d.high_price, low: d.low_price, close: d.trade_price,
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

export default function ChartContainer({ data }: ChartContainerProps) {
  const formattedData = data.map(d => ({
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
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={formatPrice} domain={['dataMin - 1000', 'dataMax + 1000']} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="trade_price" name="Price" stroke="#8884d8" fillOpacity={1} fill="url(#colorPrice)" />
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
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={formatPrice} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="candle_acc_trade_volume" name="Volume" stroke="#82ca9d" fillOpacity={1} fill="url(#colorVolume)" />
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
                    <stop offset="5%" stopColor="#ffc658" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ffc658" stopOpacity={0}/>
                </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={formatPercentage} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="change_rate" name="Change Rate" stroke="#ffc658" fillOpacity={1} fill="url(#colorChange)" />
            </AreaChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
}