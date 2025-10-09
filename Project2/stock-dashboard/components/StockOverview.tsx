import { calculateChange, formatDate, formatNumber, formatPercent, PERIOD_LABELS } from '../lib/format';
import type { PeriodDataset } from '../types/stock';

interface StockOverviewProps {
  code: string;
  name?: string;
  primaryDataset?: PeriodDataset;
}

export function StockOverview({ code, name, primaryDataset }: StockOverviewProps) {
  if (!primaryDataset || primaryDataset.candles.length === 0) {
    return (
      <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
        <p className="text-slate-400">데이터를 불러오지 못했습니다.</p>
      </section>
    );
  }

  const candles = primaryDataset.candles;
  const latest = candles[candles.length - 1];
  const previous = candles[candles.length - 2];
  const { difference, percent } = calculateChange(latest.close, previous?.close);
  const isPositive = difference >= 0;
  const label = PERIOD_LABELS[primaryDataset.period] ?? primaryDataset.label;

  const metrics: Array<{ title: string; value: string; description?: string }> = [
    {
      title: '시가',
      value: `${formatNumber(latest.open)} 원`,
    },
    {
      title: '고가',
      value: `${formatNumber(latest.high)} 원`,
    },
    {
      title: '저가',
      value: `${formatNumber(latest.low)} 원`,
    },
    {
      title: '거래량',
      value: `${formatNumber(latest.volume)}`,
      description: '최근 봉 기준',
    },
    latest.foreignRetentionRate !== undefined
      ? {
          title: '외국인 지분율',
          value: formatPercent(latest.foreignRetentionRate ?? 0),
        }
      : null,
  ].filter(Boolean) as Array<{ title: string; value: string; description?: string }>;

  return (
    <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 lg:p-8 flex flex-col gap-6 shadow-lg shadow-slate-950/30">
      <header className="flex flex-col md:flex-row md:items-end gap-3 md:gap-6">
        <div>
          <p className="text-sm text-emerald-400/80 font-semibold tracking-widest">{label}</p>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-50">
            {name ? `${name} (${code})` : code}
          </h1>
          <p className="text-slate-400 text-sm">마지막 업데이트: {formatDate(latest.date)}</p>
        </div>
        <div className="flex-1" />
        <div className="flex flex-col items-start md:items-end">
          <span className="text-4xl font-black text-slate-50">{formatNumber(latest.close)} 원</span>
          <span className={`text-lg font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositive ? '+' : ''}
            {formatNumber(difference)} 원 ({isPositive ? '+' : ''}
            {percent.toFixed(2)}%)
          </span>
        </div>
      </header>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {metrics.map((metric) => (
          <article
            key={metric.title}
            className="bg-slate-950/50 border border-slate-800 rounded-2xl px-4 py-3 flex flex-col gap-1"
          >
            <span className="text-xs text-slate-500 uppercase tracking-widest">{metric.title}</span>
            <span className="text-lg font-semibold text-slate-100">{metric.value}</span>
            {metric.description && <span className="text-xs text-slate-500">{metric.description}</span>}
          </article>
        ))}
      </div>
    </section>
  );
}
