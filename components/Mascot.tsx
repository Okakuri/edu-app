"use client";
import { useEffect, useRef } from "react";

export type MascotMood = "idle" | "cheer" | "sad" | "think";

interface Props {
  mood?: MascotMood;
  size?: number;
  className?: string;
}

// SVG 小星星机器人吉祥物
export default function Mascot({ mood = "idle", size = 80, className = "" }: Props) {
  const moodClass =
    mood === "idle"  ? "mascot-idle" :
    mood === "cheer" ? "mascot-cheer" :
    mood === "sad"   ? "mascot-sad"  : "";

  // 眼睛表情
  const eyes =
    mood === "cheer" ? (
      <>
        {/* 弯眼睛 */}
        <path d="M22 30 Q27 25 32 30" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <path d="M44 30 Q49 25 54 30" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      </>
    ) : mood === "sad" ? (
      <>
        <path d="M22 28 Q27 33 32 28" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <path d="M44 28 Q49 33 54 28" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      </>
    ) : mood === "think" ? (
      <>
        <circle cx="27" cy="29" r="3" fill="#fff"/>
        <circle cx="49" cy="29" r="3" fill="#fff"/>
        <circle cx="29" cy="27" r="1.5" fill="#12122a"/>
        <circle cx="51" cy="27" r="1.5" fill="#12122a"/>
      </>
    ) : (
      <>
        {/* 普通圆眼 */}
        <circle cx="27" cy="29" r="4" fill="#fff"/>
        <circle cx="49" cy="29" r="4" fill="#fff"/>
        <circle cx="28.5" cy="28" r="2" fill="#12122a"/>
        <circle cx="50.5" cy="28" r="2" fill="#12122a"/>
        {/* 高光 */}
        <circle cx="29.5" cy="27" r="1" fill="#fff"/>
        <circle cx="51.5" cy="27" r="1" fill="#fff"/>
      </>
    );

  const mouth =
    mood === "cheer" ? <path d="M30 38 Q38 45 46 38" stroke="#fff" strokeWidth="2" fill="rgba(255,255,255,0.1)" strokeLinecap="round"/> :
    mood === "sad"   ? <path d="M30 42 Q38 36 46 42" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round"/> :
    mood === "think" ? <path d="M32 40 Q38 38 44 40" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round"/> :
                       <path d="M30 40 Q38 44 46 40" stroke="#fff" strokeWidth="2" fill="rgba(255,255,255,0.08)" strokeLinecap="round"/>;

  return (
    <div className={`${moodClass} ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 76 96" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
        {/* 天线 */}
        <line x1="38" y1="6" x2="38" y2="16" stroke="#7c4dff" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="38" cy="4" r="4" fill="#e040fb"/>

        {/* 身体主体 */}
        <rect x="10" y="16" width="56" height="54" rx="18" fill="#2d2d6a"/>
        <rect x="10" y="16" width="56" height="54" rx="18" fill="url(#bodyGrad)"/>

        {/* 脸部区域 */}
        <rect x="16" y="22" width="44" height="36" rx="12" fill="#1e1e52"/>

        {/* 耳朵/侧翼 */}
        <rect x="4"  y="28" width="8" height="16" rx="4" fill="#2d2d6a"/>
        <rect x="64" y="28" width="8" height="16" rx="4" fill="#2d2d6a"/>

        {/* 眼睛 */}
        {eyes}

        {/* 嘴 */}
        {mouth}

        {/* 腹部装饰 */}
        <rect x="28" y="52" width="20" height="8" rx="4" fill="rgba(124,77,255,0.3)"/>
        <circle cx="35" cy="56" r="2" fill="#7c4dff"/>
        <circle cx="41" cy="56" r="2" fill="#e040fb"/>

        {/* 双腿 */}
        <rect x="22" y="68" width="10" height="18" rx="5" fill="#2d2d6a"/>
        <rect x="44" y="68" width="10" height="18" rx="5" fill="#2d2d6a"/>
        {/* 脚 */}
        <ellipse cx="27" cy="87" rx="8" ry="5" fill="#1e1e52"/>
        <ellipse cx="49" cy="87" rx="8" ry="5" fill="#1e1e52"/>

        {/* 渐变定义 */}
        <defs>
          <linearGradient id="bodyGrad" x1="10" y1="16" x2="66" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgba(124,77,255,0.3)"/>
            <stop offset="100%" stopColor="rgba(224,64,251,0.1)"/>
          </linearGradient>
        </defs>
      </svg>

      {/* 喜悦时的星星 */}
      {mood === "cheer" && (
        <div className="absolute -top-2 -right-2 text-xl" style={{ animation: "mascotCheer 0.6s ease-in-out" }}>✨</div>
      )}
    </div>
  );
}
