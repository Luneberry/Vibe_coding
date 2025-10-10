import type { BusinessDay } from 'lightweight-charts';

export function toISODate(d: string): string {
  if (!d) return d as any;
  return d.includes('-') ? d : `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`;
}
export function toBusinessDay(dateStr: string): BusinessDay {
  const [y, m, d] = toISODate(dateStr).split('-').map(Number);
  return { year: y, month: m, day: d };
}
