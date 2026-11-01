import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "WELD VISION · 焊缝视觉智能系统",
  description: "焊接机器人视觉智能系统 · 离线交互演示",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
