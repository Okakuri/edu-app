export const subjectConfig: Record<string, { badge: string; icon: string; glow: string; cardClass: string }> = {
  语文: { badge: "badge-chinese",  icon: "📖", glow: "rgba(251,146,60,0.3)",  cardClass: "glass-card-gold"   },
  数学: { badge: "badge-math",     icon: "🔢", glow: "rgba(99,102,241,0.3)",  cardClass: "glass-card-purple" },
  英语: { badge: "badge-english",  icon: "🌍", glow: "rgba(16,185,129,0.3)",  cardClass: "glass-card-green"  },
  科学: { badge: "badge-science",  icon: "🔬", glow: "rgba(6,182,212,0.3)",   cardClass: "glass-card-cyan"   },
};

export const difficultyConfig: Record<string, { badge: string; label: string }> = {
  普通: { badge: "badge-normal",   label: "普通" },
  选做: { badge: "badge-optional", label: "选做 ✦" },
  挑战: { badge: "badge-hard",     label: "挑战 🔥" },
};

export const getLevelTitle = (level: number): string => {
  if (level <= 2)  return "星际新兵";
  if (level <= 4)  return "宇宙学徒";
  if (level <= 7)  return "星空探险家";
  if (level <= 10) return "银河守护者";
  if (level <= 15) return "超新星学者";
  return "星际学霸";
};

export const getLevelEmoji = (level: number): string => {
  if (level <= 2)  return "🌱";
  if (level <= 4)  return "⭐";
  if (level <= 7)  return "🌟";
  if (level <= 10) return "💫";
  if (level <= 15) return "🌠";
  return "🚀";
};

export const xpForNextLevel = (level: number): number => level * 100;
