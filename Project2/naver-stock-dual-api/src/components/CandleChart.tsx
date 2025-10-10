'use client';
import { useEffect, useRef } from 'react';
import { createChart, ColorType, type CandlestickData, type HistogramData, type ISeriesApi } from 'lightweight-charts';

type Props = {
  candles: CandlestickData[];
  volumes?: HistogramData[];
  height?: number;
};

export default function CandleChart({ candles, volumes, height = 420 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (chartRef.current) chartRef.current.remove();

    const chart = createChart(ref.current, {
      width: ref.current.clientWidth,
      height,
      layout: { background: { type: ColorType.Solid, color: '#fff' }, textColor: '#111' },
      grid: { vertLines: { color: '#eee' }, horzLines: { color: '#eee' } },
      timeScale: { borderColor: '#eee' },
      rightPriceScale: { borderColor: '#eee' },
      localization: { locale: 'ko-KR', dateFormat: 'yyyy-MM-dd' },
    });
    chartRef.current = chart;

    const c = chart.addCandlestickSeries({
      upColor: '#ef4444', downColor: '#1d4ed8',
      wickUpColor: '#ef4444', wickDownColor: '#1d4ed8',
      borderUpColor: '#ef4444', borderDownColor: '#1d4ed8',
    });
    candleRef.current = c;

    if (volumes) {
      const v = chart.addHistogramSeries({ priceFormat: { type: 'volume' }, priceScaleId: '' });
      volRef.current = v;
      chart.priceScale('').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    }

    const onResize = () => {
      if (!ref.current || !chartRef.current) return;
      chartRef.current.applyOptions({ width: ref.current.clientWidth });
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [height]);

  useEffect(() => {
    candleRef.current?.setData(candles);
    if (volRef.current && volumes) volRef.current.setData(volumes);
    chartRef.current?.timeScale().fitContent();
    chartRef.current?.timeScale().scrollToRealTime();
  }, [candles, volumes]);

  return <div ref={ref} className="w-full h-[440px] rounded-2xl border border-gray-200 shadow-sm" />;
}
