export const PERIOD_LABELS: Record<string, string> = {
  dayCandle: '일봉',
  weekCandle: '주봉',
  monthCandle: '월봉',
};

export function formatNumber(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatPercent(value: number, fractionDigits = 2): string {
  return `${formatNumber(value, fractionDigits)}%`;
}

export function formatDate(value: string | number): string {
  const date = typeof value === 'number' ? new Date(value) : parseLocalDate(value);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function parseLocalDate(localDate: string): Date {
  const year = Number(localDate.slice(0, 4));
  const month = Number(localDate.slice(4, 6)) - 1;
  const day = Number(localDate.slice(6, 8));
  return new Date(Date.UTC(year, month, day));
}

export function calculateChange(current: number, previous?: number) {
  if (previous === undefined || previous === 0) {
    return { difference: 0, percent: 0 };
  }
  const difference = current - previous;
  const percent = (difference / previous) * 100;
  return { difference, percent };
}
