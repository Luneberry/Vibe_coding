export type CandlePeriod = 'dayCandle' | 'weekCandle' | 'monthCandle' | string;

export interface CandleDatum {
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  foreignRetentionRate?: number;
}

export interface PeriodDataset {
  period: CandlePeriod;
  label: string;
  candles: CandleDatum[];
}

export interface StockDataset {
  code: string;
  name?: string;
  periods: Record<CandlePeriod, PeriodDataset>;
}

export interface StockApiResponse {
  code: string;
  name?: string;
  periods: Record<CandlePeriod, CandleDatum[]>;
}
