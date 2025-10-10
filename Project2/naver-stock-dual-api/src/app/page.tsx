'use client';
import { useEffect, useMemo, useState } from 'react';
import CandleChart from '../components/CandleChart';
import { toBusinessDay } from '../lib/time';

type Period = 'dayCandle' | 'weekCandle' | 'monthCandle' | 'yearCandle';

type PriceInfo = {
  localDate: string;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  closePrice: number;
  accumulatedTradingVolume?: number;
  volume?: number;
};
type CandleResp = {
  code: string;
  periodType: string;
  priceInfos?: PriceInfo[];
  chart?: any;
  result?: any;
  error?: string;
};

type TotalInfo = { code: string; key: string; value: string; valueDesc?: string; };
type Deal = { bizdate: string; closePrice: string; accumulatedTradingVolume?: string; };
type Integration = {
  stockName: string;
  itemCode: string;
  totalInfos?: TotalInfo[];
  dealTrendInfos?: Deal[];
};

const FAV_KEY = 'favorites_v1';

export default function Home() {
  const [code, setCode] = useState('005930');
  const [period, setPeriod] = useState<Period>('dayCandle');
  const [candlesRaw, setCandlesRaw] = useState<PriceInfo[]>([]);
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  // ⭐ 즐겨찾기
  const [favorites, setFavorites] = useState<string[]>([]);

  // 즐겨찾기 초기 로드
  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem(FAV_KEY) : null;
      if (saved) setFavorites(JSON.parse(saved));
    } catch {}
  }, []);

  // 즐겨찾기 저장 헬퍼
  function saveFav(list: string[]) {
    setFavorites(list);
    try { localStorage.setItem(FAV_KEY, JSON.stringify(list)); } catch {}
  }

  // 즐겨찾기 토글
  function toggleFavorite(c: string) {
    saveFav(favorites.includes(c) ? favorites.filter(x => x !== c) : [c, ...favorites]);
  }

  const isFav = favorites.includes(code);

  async function loadAll(c: string, p: Period) {
    setLoading(true); setError('');
    try {
      // 1) integration (핵심 지표/요약)
      const iRes = await fetch(`/api/integration?code=${encodeURIComponent(c)}`);
      const iJson = await iRes.json();
      if (!iRes.ok || iJson?.error) throw new Error('integration fetch failed');
      setIntegration(iJson);

      // 2) candles (OHLC)
      const cRes = await fetch(`/api/candles?code=${encodeURIComponent(c)}&periodType=${p}`);
      const cJson: CandleResp = await cRes.json();
      if (!cRes.ok || cJson?.error) throw new Error('candles fetch failed');

      const arr =
        cJson?.priceInfos ??
        cJson?.chart?.result?.daily ??
        cJson?.chart?.result?.items ??
        [];
      setCandlesRaw(Array.isArray(arr) ? arr : []);
    } catch (e:any) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      setCandlesRaw([]);
      setIntegration(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(code, period); }, []);
  useEffect(() => { loadAll(code, period); }, [period]);

  // 차트용 데이터 매핑 (+ 오름차순 정렬)
  const candles = useMemo(() => {
    const sorted = candlesRaw.slice().sort((a,b) => a.localDate.localeCompare(b.localDate));
    return sorted.map(d => ({
      time: toBusinessDay(d.localDate),
      open: d.openPrice,
      high: d.highPrice,
      low: d.lowPrice,
      close: d.closePrice,
    }));
  }, [candlesRaw]);

  const volumes = useMemo(() => {
    const sorted = candlesRaw.slice().sort((a,b) => a.localDate.localeCompare(b.localDate));
    return sorted.map(d => ({
      time: toBusinessDay(d.localDate),
      value: d.accumulatedTradingVolume ?? d.volume ?? 0,
      color: d.closePrice >= d.openPrice ? '#ef4444' : '#1d4ed8',
    }));
  }, [candlesRaw]);

  const kv = useMemo(() => {
    const map = new Map<string,string>();
    (integration?.totalInfos ?? []).forEach(t => map.set(t.code, t.value));
    return map;
  }, [integration]);

  const title = integration ? `${integration.stockName} (${integration.itemCode})` : code;
  const nice = (v:any) => v ?? '-';

  return (
    <div className="space-y-6">
      <div className="card flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="flex-1 flex gap-2">
          <input
            className="input w-full"
            value={code}
            onChange={e=>setCode(e.target.value)}
            placeholder="종목코드 6자리 (예: 005930)"
          />
          <button
            className="btn bg-[var(--color-primary-background-default)] text-white whitespace-nowrap"
            onClick={()=>loadAll(code, period)}
            disabled={loading}
          >
            불러오기
          </button>
          {/* ⭐ 즐겨찾기 토글 버튼 */}
          <button
            className={`btn whitespace-nowrap ${isFav ? 'bg-yellow-400 text-black' : 'bg-gray-200 text-gray-800'}`}
            onClick={() => toggleFavorite(code)}
            title={isFav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          >
            {isFav ? '★ 즐겨찾기' : '☆ 즐겨찾기'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['dayCandle','weekCandle','monthCandle','yearCandle'] as Period[]).map(p => (
            <button
              key={p}
              className={`btn ${period===p ? 'border-[#03C75A] bg-[#03C75A]/10' : ''}`}
              onClick={()=>setPeriod(p)}
            >
              {p==='dayCandle'?'일봉':p==='weekCandle'?'주봉':p==='monthCandle'?'월봉':'년봉'}
            </button>
          ))}
        </div>
      </div>

      {/* ⭐ 즐겨찾기 목록 */}
      {favorites.length > 0 && (
        <div className="card">
          <div className="text-sm text-gray-600 mb-2">⭐ 즐겨찾기 종목</div>
          <div className="flex flex-wrap gap-2">
            {favorites.map(f => (
              <button
                key={f}
                onClick={() => { setCode(f); loadAll(f, period); }}
                className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition"
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <div className="card text-sm text-red-600 bg-red-50">{error}</div>}

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 card">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">{title}</div>
          </div>
          <CandleChart candles={candles} volumes={volumes} />
        </div>

        <div className="card space-y-2">
          <div className="text-sm text-gray-500">핵심 지표</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 rounded-xl bg-gray-50">전일가<br/><span className="font-semibold">{nice(kv.get('lastClosePrice'))}</span></div>
            <div className="p-2 rounded-xl bg-gray-50">현재가<br/><span className="font-semibold">{nice(integration?.dealTrendInfos?.[0]?.closePrice)}</span></div>
            <div className="p-2 rounded-xl bg-gray-50">시가<br/><span className="font-semibold">{nice(kv.get('openPrice'))}</span></div>
            <div className="p-2 rounded-xl bg-gray-50">고가<br/><span className="font-semibold">{nice(kv.get('highPrice'))}</span></div>
            <div className="p-2 rounded-xl bg-gray-50">저가<br/><span className="font-semibold">{nice(kv.get('lowPrice'))}</span></div>
            <div className="p-2 rounded-xl bg-gray-50">거래량<br/><span className="font-semibold">{nice(kv.get('accumulatedTradingVolume'))}</span></div>
            <div className="p-2 rounded-xl bg-gray-50">시총<br/><span className="font-semibold">{nice(kv.get('marketValue'))}</span></div>
            <div className="p-2 rounded-xl bg-gray-50">PER<br/><span className="font-semibold">{nice(kv.get('per'))}</span></div>
            <div className="p-2 rounded-xl bg-gray-50">PBR<br/><span className="font-semibold">{nice(kv.get('pbr'))}</span></div>
            <div className="p-2 rounded-xl bg-gray-50">배당수익률<br/><span className="font-semibold">{nice(kv.get('dividendYieldRatio'))}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
