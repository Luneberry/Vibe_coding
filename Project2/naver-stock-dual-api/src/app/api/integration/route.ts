import { NextRequest, NextResponse } from 'next/server';
const H: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Referer': 'https://m.stock.naver.com',
  'Origin': 'https://m.stock.naver.com',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
};


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 });
  const url = `https://m.stock.naver.com/api/stock/${encodeURIComponent(code)}/integration`;
  const r = await fetch(url, { headers: H, cache: 'no-store' });
  const text = await r.text();
  if (!r.ok) {
    return new NextResponse(JSON.stringify({ error: 'fetch_failed', status: r.status, sample: text.slice(0, 200) }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      status: r.status,
    });
  }
  return new NextResponse(text, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    status: 200,
  });
}
