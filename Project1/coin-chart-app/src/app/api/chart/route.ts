
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const to = searchParams.get('to'); // 기준일 (e.g., 2025-09-24)
  const count = searchParams.get('count'); // 기간 (e.g., 100)
  const market = 'KRW-BTC'; // Market, hardcoded for now

  if (!to || !count) {
    return NextResponse.json({ error: 'Missing required parameters: to, count' }, { status: 400 });
  }

  // Upbit API requires the 'to' parameter to be in ISO 8601 format, including time.
  // We append time and 'Z' for UTC.
  const upbitApiTo = `${to}T09:00:00Z`;

  const url = `https://api.upbit.com/v1/candles/days?market=${market}&to=${upbitApiTo}&count=${count}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Upbit API Error:', errorData);
      return NextResponse.json({ error: `Failed to fetch from Upbit API: ${errorData.error.message}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Internal Server Error:', error);
    if (error instanceof Error) {
        return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown internal server error occurred' }, { status: 500 });
  }
}
