import type { Metadata } from "next";
import "./globals.css";
import "./pdf-layout.css";
export const metadata: Metadata = {
  title: "焊缝识别系统 · 机器人视觉工作台",
  description: "焊缝识别、坐标标定与程序预演工作台",
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
