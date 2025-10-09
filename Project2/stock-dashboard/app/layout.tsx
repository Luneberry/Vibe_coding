import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '네이버 증권 시각화 대시보드',
  description: '네이버 증권 데이터를 기반으로 한 종목 시각화 대시보드',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen">{children}</body>
    </html>
  );
}
