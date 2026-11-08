"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/",         label: "工作台", icon: "🚀", color: "#9c7cff" },
  { href: "/practice", label: "练习",   icon: "✨", color: "#4fc3f7" },
  { href: "/shop",     label: "商店",   icon: "🎁", color: "#ffd54f" },
  { href: "/profile",  label: "成长",   icon: "⭐", color: "#ffb74d" },
  { href: "/parent",   label: "家长",   icon: "🌙", color: "#f48fb1" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50">
      <div className="flex">
        {NAV.map(item => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 relative">
              {/* 激活背景光晕 */}
              {active && (
                <span className="absolute top-1 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full"
                  style={{ background: `${item.color}20`, filter: "blur(6px)" }} />
              )}
              {/* 激活指示条 */}
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: item.color }} />
              )}
              <span className={`text-2xl leading-none transition-all duration-200 ${
                active ? "scale-110" : "scale-90 opacity-40"
              }`}>{item.icon}</span>
              <span className={`text-[9px] font-bold tracking-wide transition-all ${
                active ? "" : ""
              }`} style={{ color: active ? item.color : "var(--text-3)" }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
