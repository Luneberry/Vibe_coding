'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { SearchForm } from '../components/SearchForm';
import { StockOverview } from '../components/StockOverview';
import { PeriodTabs } from '../components/PeriodTabs';
import { TimeframePanel } from '../components/TimeframePanel';
import { CandleTable } from '../components/CandleTable';
import type { CandlePeriod, PeriodDataset, StockApiResponse, StockDataset } from '../types/stock';
import { PERIOD_LABELS } from '../lib/format';

const DEFAULT_CODE = '005930';
const DEFAULT_PERIODS: CandlePeriod[] = ['dayCandle', 'weekCandle', 'monthCandle'];

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => {
      if (!res.ok) {
        throw new Error('데이터를 불러오는 중 오류가 발생했습니다.');
      }
      return res.json();
    })
    .then((json: StockApiResponse) => json);

function buildDataset(payload?: StockApiResponse): StockDataset | undefined {
  if (!payload) return undefined;
  const periods: Record<CandlePeriod, PeriodDataset> = {};

  Object.entries(payload.periods).forEach(([period, candles]) => {
    const typedPeriod = period as CandlePeriod;
    periods[typedPeriod] = {
      period: typedPeriod,
      label: PERIOD_LABELS[typedPeriod] ?? typedPeriod,
      candles,
    };
  });

  return {
    code: payload.code,
    name: payload.name,
    periods,
  };
}

export default function HomePage() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [activePeriod, setActivePeriod] = useState<CandlePeriod>('dayCandle');
  const { data, isLoading, error } = useSWR<StockApiResponse>(
    `/api/stocks/${code}?periodTypes=${DEFAULT_PERIODS.join(',')}`,
    fetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  const dataset = useMemo(() => buildDataset(data), [data]);
  const primaryDataset = dataset?.periods[activePeriod];

  useEffect(() => {
    if (dataset && !dataset.periods[activePeriod]) {
      const available = Object.keys(dataset.periods)[0] as CandlePeriod;
      setActivePeriod(available);
    }
  }, [dataset, activePeriod]);

  const handleSearch = useCallback(
    (nextCode: string) => {
      setCode(nextCode);
      setActivePeriod('dayCandle');
    },
    []
  );

  const availablePeriods = useMemo(() => Object.keys(dataset?.periods ?? {}) as CandlePeriod[], [dataset]);

  const renderContent = () => {
    if (error) {
      return (
        <section className="bg-rose-500/10 border border-rose-500/40 text-rose-100 rounded-3xl p-6">
          <h2 className="text-xl font-semibold mb-2">데이터를 불러올 수 없습니다.</h2>
          <p className="text-sm">잠시 후 다시 시도해주세요.</p>
        </section>
      );
    }

    if (isLoading || !dataset) {
      return (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-slate-800/70 rounded" />
            <div className="h-80 bg-slate-800/60 rounded-3xl" />
            <div className="h-32 bg-slate-800/50 rounded-3xl" />
          </div>
        </section>
      );
    }

    return (
      <div className="flex flex-col gap-8">
        <StockOverview code={dataset.code} name={dataset.name} primaryDataset={primaryDataset} />

        {availablePeriods.length > 0 && (
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-lg font-semibold text-slate-200">봉 차트</h2>
            <PeriodTabs periods={availablePeriods} active={activePeriod} onChange={setActivePeriod} />
          </div>
        )}

        {primaryDataset && <TimeframePanel dataset={primaryDataset} />}

        {primaryDataset && (
          <section className="flex flex-col gap-4">
            <header className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="text-lg font-semibold text-slate-200">
                {PERIOD_LABELS[primaryDataset.period] ?? primaryDataset.label} 상세 데이터
              </h3>
              <span className="text-xs text-slate-400">최근 {Math.min(primaryDataset.candles.length, 50)}개 봉을 표시합니다.</span>
            </header>
            <CandleTable dataset={primaryDataset} />
          </section>
        )}
      </div>
    );
  };

  return (
    <main className="max-w-6xl mx-auto px-4 lg:px-8 py-10 flex flex-col gap-10">
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-emerald-400/80 font-semibold uppercase tracking-[0.4em]">NAVER STOCK INSIGHT</p>
          <h1 className="text-4xl md:text-5xl font-black text-slate-50">네이버 증권 시각화 대시보드</h1>
          <p className="text-slate-400 max-w-2xl">
            종목 코드를 입력하면 네이버 증권 데이터를 기반으로 일봉, 주봉, 월봉 데이터를 자동으로 불러오고 시각화합니다.
          </p>
        </div>
        <SearchForm initialCode={DEFAULT_CODE} onSubmit={handleSearch} loading={isLoading} />
      </section>
      {renderContent()}
      <footer className="pb-12 text-xs text-slate-500 text-center">
        데이터 출처: NAVER 증권 · 본 서비스는 학습 및 연구 목적의 예시입니다.
      </footer>
    </main>
  );
}
