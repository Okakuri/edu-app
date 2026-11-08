import { prisma } from "@/lib/prisma";
import { connection } from "next/server";
import { getLevelTitle, getLevelEmoji, xpForNextLevel } from "@/lib/utils";

const STUDENT_ID = "student-001";

const ACHIEVEMENTS = [
  { id: "streak3",  icon: "🔥", title: "连续3天",   desc: "连续打卡3天",   threshold: 3,  type: "streak"      },
  { id: "streak7",  icon: "💪", title: "坚持一周",   desc: "连续打卡7天",   threshold: 7,  type: "streak"      },
  { id: "tasks10",  icon: "✅", title: "勤奋学生",   desc: "完成10次任务", threshold: 10, type: "completions" },
  { id: "tasks50",  icon: "🏆", title: "学习达人",   desc: "完成50次任务", threshold: 50, type: "completions" },
  { id: "level5",   icon: "⭐", title: "星空探险家", desc: "升到5级",       threshold: 5,  type: "level"       },
  { id: "level10",  icon: "🌟", title: "银河守护者", desc: "升到10级",      threshold: 10, type: "level"       },
];

async function getPageData() {
  const student = await prisma.student.findUnique({
    where: { id: STUDENT_ID },
    include: {
      completions: { orderBy: { completedAt: "desc" }, take: 10, include: { task: true } },
      _count: { select: { completions: true } },
    },
  });

  // 最近7天每天完成数
  const today = new Date();
  const weekDays: { label: string; count: number; isToday: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const count = await prisma.taskCompletion.count({
      where: { studentId: STUDENT_ID, completedAt: { gte: d, lt: next } },
    });
    weekDays.push({
      label: i === 0 ? "今" : ["日","一","二","三","四","五","六"][d.getDay()],
      count,
      isToday: i === 0,
    });
  }

  return { student, weekDays };
}

export default async function ProfilePage() {
  await connection();
  const { student, weekDays } = await getPageData();
  if (!student) return null;

  const xpNeeded = xpForNextLevel(student.level);
  const xpBase = student.level * (student.level - 1) * 50;
  const xpCurrent = Math.max(0, student.xp - xpBase);
  const xpPct = Math.min(Math.round((xpCurrent / xpNeeded) * 100), 100);
  const totalCompletions = student._count.completions;
  const weekTotal = weekDays.reduce((s, d) => s + d.count, 0);
  const maxCount = Math.max(...weekDays.map((d) => d.count), 1);

  return (
    <div className="flex flex-col min-h-screen text-slate-100">
      {/* Hero */}
      <div className="relative px-4 pt-12 pb-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #a855f7, transparent)" }} />
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl">⭐</span>
          <h1 className="text-white text-xl font-bold">我的成长</h1>
        </div>

        {/* Level card */}
        <div className="glass-card-purple glow-purple rounded-3xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl float"
              style={{ background: "linear-gradient(135deg,#a855f7,#6366f1)", boxShadow: "0 0 20px rgba(168,85,247,0.5)" }}>
              {getLevelEmoji(student.level)}
            </div>
            <div className="flex-1">
              <p className="text-gradient-purple font-black text-2xl">Lv.{student.level}</p>
              <p className="text-slate-300 font-semibold">{getLevelTitle(student.level)}</p>
              <p className="text-slate-500 text-xs">{student.name} · {student.grade}年级</p>
              <div className="mt-2">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>⚡ {xpCurrent} / {xpNeeded} 星能</span>
                  <span>→ Lv.{student.level + 1}</span>
                </div>
                <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="xp-bar-fill h-full rounded-full" style={{ width: `${xpPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4 pb-6">
        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "总星能", value: student.xp,    unit: "XP", icon: "⚡", cls: "glass-card-purple" },
            { label: "星钻",   value: student.points, unit: "颗", icon: "💎", cls: "glass-card-cyan"   },
            { label: "连续",   value: student.streak, unit: "天", icon: "🔥", cls: "glass-card-gold"   },
          ].map((s) => (
            <div key={s.label} className={`${s.cls} rounded-2xl p-3 text-center`}>
              <p className="text-xl mb-1">{s.icon}</p>
              <p className="font-black text-white text-lg leading-none">{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.unit}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* 7天打卡柱状图 */}
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span>📅</span>
              <h2 className="text-white font-bold text-sm">本周打卡</h2>
            </div>
            <span className="glass-card-purple text-purple-300 text-xs px-3 py-1 rounded-full font-semibold">
              本周 {weekTotal} 次
            </span>
          </div>
          <div className="flex items-end justify-between gap-1.5 h-20">
            {weekDays.map((day, i) => {
              const heightPct = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex flex-col justify-end" style={{ height: 56 }}>
                    <div
                      className="w-full rounded-t-lg transition-all duration-700 relative overflow-visible"
                      style={{
                        height: day.count > 0 ? `${Math.max(heightPct, 15)}%` : "3px",
                        background: day.isToday
                          ? "linear-gradient(180deg,#a855f7,#6366f1)"
                          : day.count > 0
                          ? "linear-gradient(180deg,rgba(168,85,247,0.5),rgba(99,102,241,0.3))"
                          : "rgba(255,255,255,0.06)",
                        boxShadow: day.count > 0 && day.isToday ? "0 0 10px rgba(168,85,247,0.5)" : "none",
                      }}
                    >
                      {day.count > 0 && (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-purple-300">
                          {day.count}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold ${day.isToday ? "text-purple-400" : "text-slate-500"}`}>
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total completions */}
        <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs mb-1">累计完成任务</p>
            <p className="text-gradient-purple font-black text-4xl">{totalCompletions}</p>
            <p className="text-slate-500 text-xs">次打卡记录</p>
          </div>
          <span className="text-5xl float-slow">🎯</span>
        </div>

        {/* Achievements */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🏅</span>
            <h2 className="text-white font-bold">成就徽章</h2>
            <span className="text-xs text-slate-500 ml-auto">
              {ACHIEVEMENTS.filter((a) => {
                if (a.type === "streak")      return student.streak >= a.threshold;
                if (a.type === "completions") return totalCompletions >= a.threshold;
                if (a.type === "level")       return student.level >= a.threshold;
                return false;
              }).length} / {ACHIEVEMENTS.length} 解锁
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {ACHIEVEMENTS.map((a) => {
              let unlocked = false;
              if (a.type === "streak")      unlocked = student.streak >= a.threshold;
              if (a.type === "completions") unlocked = totalCompletions >= a.threshold;
              if (a.type === "level")       unlocked = student.level >= a.threshold;
              return (
                <div key={a.id} className={`rounded-2xl p-3 text-center transition-all ${
                  unlocked ? "glass-card-purple glow-purple" : "glass-card opacity-40"
                }`}>
                  <p className={`text-2xl mb-1 ${unlocked ? "" : "grayscale"}`}>{a.icon}</p>
                  <p className={`text-xs font-bold leading-tight ${unlocked ? "text-purple-300" : "text-slate-500"}`}>{a.title}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{a.desc}</p>
                  {unlocked && <p className="text-[10px] text-purple-400 mt-1 sparkle">已解锁 ✦</p>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent completions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📋</span>
            <h2 className="text-white font-bold">最近记录</h2>
          </div>
          {student.completions.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 text-center">
              <p className="text-3xl mb-2">🌌</p>
              <p className="text-slate-500 text-sm">暂无记录，快去完成任务吧</p>
            </div>
          ) : (
            <div className="space-y-2">
              {student.completions.map((c) => (
                <div key={c.id} className="glass-card rounded-xl px-4 py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{c.task.title}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(c.completedAt).toLocaleDateString("zh-CN", {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-purple-400 font-medium">⚡+{c.task.xpReward}</p>
                    <p className="text-xs text-cyan-400">💎+{c.task.pointReward}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
