import { formatDate, formatNumber, formatPercent } from '@/lib/format';
import type { PeriodDataset } from '@/types/stock';

interface CandleTableProps {
  dataset: PeriodDataset;
  limit?: number;
}

export function CandleTable({ dataset, limit = 50 }: CandleTableProps) {
  const rows = [...dataset.candles].slice(-limit).reverse();

  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/60">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-slate-900/80 text-slate-400 uppercase text-xs tracking-widest">
          <tr>
            <th className="px-4 py-3 text-left">날짜</th>
            <th className="px-4 py-3 text-right">시가</th>
            <th className="px-4 py-3 text-right">고가</th>
            <th className="px-4 py-3 text-right">저가</th>
            <th className="px-4 py-3 text-right">종가</th>
            <th className="px-4 py-3 text-right">거래량</th>
            <th className="px-4 py-3 text-right">등락</th>
            <th className="px-4 py-3 text-right">외국인 지분율</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const prev = dataset.candles[dataset.candles.length - index - 2];
            const diff = row.close - (prev?.close ?? row.open);
            const percent = prev ? (diff / prev.close) * 100 : 0;
            const positive = diff >= 0;

            return (
              <tr
                key={row.date}
                className="border-t border-slate-800/80 hover:bg-slate-800/40 transition"
              >
                <td className="px-4 py-3 text-left text-slate-200">{formatDate(row.date)}</td>
                <td className="px-4 py-3 text-right">{formatNumber(row.open)}</td>
                <td className="px-4 py-3 text-right">{formatNumber(row.high)}</td>
                <td className="px-4 py-3 text-right">{formatNumber(row.low)}</td>
                <td className={`px-4 py-3 text-right font-semibold ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatNumber(row.close)}
                </td>
                <td className="px-4 py-3 text-right">{formatNumber(row.volume)}</td>
                <td className={`px-4 py-3 text-right ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {positive ? '+' : ''}
                  {formatNumber(diff)} ({percent.toFixed(2)}%)
                </td>
                <td className="px-4 py-3 text-right">
                  {row.foreignRetentionRate !== undefined ? formatPercent(row.foreignRetentionRate) : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
