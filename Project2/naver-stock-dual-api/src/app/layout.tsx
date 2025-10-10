import './globals.css';
export const metadata = {
  title: 'Naver Stock Viewer',
  description: 'Integration + Candles (naver m.stock / chart APIs)',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        <div className="max-w-6xl mx-auto p-4">{children}</div>
      </body>
    </html>
  );
}
