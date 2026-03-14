import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "클래스킥스타터 — 노션 원데이클래스",
  description: "수요가 모이면 강의가 열립니다. 토요일 아침, 노션을 제대로 배웁니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
