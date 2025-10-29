'use server';

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const url = new URL('https://streaming.assemblyai.com/v3/token');
    // Set the expiration time for the temporary token, e.g., 600 seconds (10 minutes)
    url.searchParams.set('expires_in_seconds', '600');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': process.env.ASSEMBLYAI_API_KEY ?? ''
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`AssemblyAI Token Error: ${errorData.error}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching AssemblyAI token:', errorMessage);
    return NextResponse.json(
      { error: `Failed to fetch AssemblyAI token: ${errorMessage}` },
      { status: 500 }
    );
  }
}
