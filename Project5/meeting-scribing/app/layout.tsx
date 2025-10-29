import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI 회의록 메모 시스템",
  description: "회의 중 자유롭게 메모를 작성하고 AI로 자동 요약하는 시스템",
  keywords: ["회의록", "메모", "AI", "자동요약", "STT"],
  authors: [{ name: "AI Meeting Notes Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
