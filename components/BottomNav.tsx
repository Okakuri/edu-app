"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/",         label: "工作台", icon: "🚀", activeColor: "text-purple-400" },
  { href: "/practice", label: "练习",   icon: "✨", activeColor: "text-cyan-400"   },
  { href: "/shop",     label: "商店",   icon: "🎁", activeColor: "text-yellow-400" },
  { href: "/profile",  label: "成长",   icon: "⭐", activeColor: "text-amber-400"  },
  { href: "/parent",   label: "家长",   icon: "🌙", activeColor: "text-pink-400"   },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="nav-bar fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50">
      <div className="flex px-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 relative"
            >
              {isActive && (
                <span className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-purple-500/20 blur-sm" />
              )}
              <span className={`text-xl leading-none transition-all duration-200 ${
                isActive ? "scale-110 drop-shadow-lg" : "opacity-40 scale-90"
              }`}>
                {item.icon}
              </span>
              <span className={`text-[9px] font-semibold tracking-wide transition-all ${
                isActive ? item.activeColor : "text-slate-600"
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
