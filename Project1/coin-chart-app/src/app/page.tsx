'use client';

import { useState } from 'react';
import { Candle } from '@/types';
import Header from '@/components/Header';
import ChartContainer from '@/components/ChartContainer';
import Summary from '@/components/Summary';

export default function Home() {
  const [data, setData] = useState<Candle[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (date: string, period: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/chart?to=${date}&count=${period}`); 
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch data');
      }
      const jsonData = await response.json();
      
      if (!Array.isArray(jsonData) || jsonData.length === 0) {
        throw new Error('No data returned from API. The selected date might be in the future or no data is available.');
      }

      // The data from Upbit is in reverse chronological order, so we reverse it for the charts.
      setData(jsonData.reverse());
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8 sm:p-12 md:p-24">
      <div className="z-10 w-full max-w-7xl items-center justify-between font-mono text-sm lg:flex flex-col gap-8">
        <h1 className="text-4xl font-bold text-center mb-8">Coin Chart Viewer</h1>
        
        <Header onSearch={handleSearch} isLoading={isLoading} />

        {error && <p className="text-red-500 text-center my-4">Error: {error}</p>}

        {data ? (
          <div className='w-full flex flex-col gap-8'>
            <Summary data={data} />
            <ChartContainer data={data} />
          </div>
        ) : (
          !isLoading && !error && (
            <div className='w-full text-center p-8 border border-dashed border-gray-700 rounded-lg'>
              <p>Please select a date and period, then click 조회.</p>
            </div>
          )
        )}
        {isLoading && <p className='text-center my-4'>Loading data...</p>}
      </div>
    </main>
  );
}