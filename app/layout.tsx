import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "星际学霸 · 小升初",
  description: "开启你的星际学习冒险",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased" style={{ background: "#0d0d1a" }}>
        <div className="stars-bg" />
        <div className="relative mx-auto w-full max-w-[430px] min-h-screen z-10">
          <main className="pb-20 page-enter">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
