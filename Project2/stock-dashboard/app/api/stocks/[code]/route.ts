import { NextResponse } from 'next/server';
import type { CandlePeriod, StockApiResponse, CandleDatum } from '@/types/stock';
import { parseLocalDate } from '@/lib/format';

const DEFAULT_PERIODS: CandlePeriod[] = ['dayCandle', 'weekCandle', 'monthCandle'];

const NAVER_HEADERS: Record<string, string> = {
  accept: 'application/json, text/plain, */*',
  'accept-language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  origin: 'https://m.stock.naver.com',
  referer: 'https://m.stock.naver.com/domestic/stock',
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
};

async function fetchPeriodData(code: string, period: CandlePeriod): Promise<CandleDatum[]> {
  const url = `https://api.stock.naver.com/chart/domestic/item/${code}?periodType=${period}`;
  const response = await fetch(url, {
    headers: NAVER_HEADERS,
    cache: 'no-store',
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`네이버 증권 API 요청 실패 (${period}): ${response.status}`);
  }

  const payload = await response.json();
  const priceInfos: Array<Record<string, number | string | undefined>> = payload.priceInfos ?? [];

  return priceInfos
    .map((priceInfo) => {
      const localDate = String(priceInfo.localDate ?? '');
      const date = localDate.length === 8 ? localDate : undefined;

      if (!date) {
        return null;
      }

      const candle: CandleDatum = {
        date,
        timestamp: Number(parseLocalDate(date)),
        open: Number(priceInfo.openPrice ?? 0),
        high: Number(priceInfo.highPrice ?? 0),
        low: Number(priceInfo.lowPrice ?? 0),
        close: Number(priceInfo.closePrice ?? 0),
        volume: Number(priceInfo.accumulatedTradingVolume ?? 0),
        foreignRetentionRate:
          priceInfo.foreignRetentionRate !== undefined
            ? Number(priceInfo.foreignRetentionRate)
            : undefined,
      };

      return candle;
    })
    .filter((candle): candle is CandleDatum => candle !== null)
    .sort((a, b) => a.timestamp - b.timestamp);
}

async function fetchStockName(code: string): Promise<string | undefined> {
  try {
    const url = `https://api.stock.naver.com/domestic/stock/${code}`;
    const response = await fetch(url, {
      headers: NAVER_HEADERS,
      cache: 'no-store',
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return undefined;
    }

    const json = await response.json();
    return json?.stockName ?? json?.stockNameEng ?? undefined;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

export async function GET(request: Request, context: { params: { code: string } }) {
  const code = context.params.code;
  if (!code) {
    return NextResponse.json({ message: '종목 코드를 입력해주세요.' }, { status: 400 });
  }

  const url = new URL(request.url);
  const periodQuery = url.searchParams.get('periodTypes');
  const periods = periodQuery
    ? periodQuery
        .split(',')
        .map((period) => period.trim())
        .filter(Boolean)
    : DEFAULT_PERIODS;

  try {
    const [name, ...periodPayloads] = await Promise.all([
      fetchStockName(code),
      ...periods.map((period) => fetchPeriodData(code, period)),
    ]);

    const periodsRecord: StockApiResponse['periods'] = {};
    periodPayloads.forEach((candles, index) => {
      const period = periods[index];
      periodsRecord[period] = candles;
    });

    const response: StockApiResponse = {
      code,
      name: name ?? undefined,
      periods: periodsRecord,
    };

    return NextResponse.json(response, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        message: '네이버 증권 데이터를 불러오는 중 오류가 발생했습니다.',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 502 }
    );
  }
}
