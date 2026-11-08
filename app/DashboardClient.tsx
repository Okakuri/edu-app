"use client";
import { useState } from "react";
import { subjectConfig, difficultyConfig, getLevelTitle, getLevelEmoji, xpForNextLevel } from "@/lib/utils";

interface Task {
  id: string; title: string; subject: string; type: string; difficulty: string;
  xpReward: number; pointReward: number; estimatedMinutes: number;
  description: string | null; completed: boolean;
}
interface Student {
  name: string; grade: number; xp: number; points: number; level: number; streak: number;
}
interface Reward { xp: number; points: number; levelUp: boolean; streak: number }

const GREETINGS = ["加油！", "继续冲！", "你最棒！", "今天也要努力！", "星际学霸冲冲冲！"];

export default function DashboardClient({
  student: initialStudent, initialTasks,
}: { student: Student; initialTasks: Task[] }) {
  const [tasks, setTasks]       = useState(initialTasks);
  const [student, setStudent]   = useState(initialStudent);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [reward, setReward]     = useState<Reward | null>(null);
  const [greeting]              = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);

  const completed = tasks.filter((t) => t.completed).length;
  const total     = tasks.length;
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;
  const allDone   = total > 0 && completed === total;

  const xpNeeded  = xpForNextLevel(student.level);
  const xpBase    = student.level * (student.level - 1) * 50;
  const xpCurrent = Math.max(0, student.xp - xpBase);
  const xpPct     = Math.min(Math.round((xpCurrent / xpNeeded) * 100), 100);

  const today = new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" });

  const grouped: Record<string, Task[]> = {};
  for (const t of tasks) {
    if (!grouped[t.subject]) grouped[t.subject] = [];
    grouped[t.subject].push(t);
  }

  const handleComplete = async (taskId: string) => {
    if (completingId) return;
    setCompletingId(taskId);
    try {
      const res  = await fetch(`/api/tasks/${taskId}/complete`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, completed: true } : t));
        setStudent((prev) => ({
          ...prev, xp: data.newXp, points: data.newPoints,
          level: data.newLevel, streak: data.newStreak,
        }));
        setReward({ xp: data.xpGained, points: data.pointsGained, levelUp: data.levelUp, streak: data.newStreak });
        setTimeout(() => setReward(null), 3000);
      }
    } finally { setCompletingId(null); }
  };

  return (
    <div className="flex flex-col min-h-screen text-slate-100">
      {/* ── Hero header ── */}
      <div className="relative px-4 pt-12 pb-4 overflow-hidden">
        <div className="absolute top-4 right-4 w-28 h-28 rounded-full opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #a855f7, transparent)" }} />
        <div className="absolute top-16 right-14 w-14 h-14 rounded-full opacity-25 pointer-events-none"
          style={{ background: "radial-gradient(circle, #06b6d4, transparent)" }} />

        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-slate-400 text-xs mb-1">{today}</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl float">{getLevelEmoji(student.level)}</span>
              <div>
                <h1 className="text-white text-xl font-bold leading-tight">
                  {student.name}，{greeting}
                </h1>
                <p className="text-purple-300 text-xs font-medium mt-0.5">
                  Lv.{student.level} · {getLevelTitle(student.level)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="glass-card rounded-full px-3 py-1.5 flex items-center gap-1.5">
              <span className="streak-fire text-base">🔥</span>
              <span className="text-orange-300 font-bold text-sm">{student.streak}</span>
              <span className="text-slate-400 text-xs">天</span>
            </div>
            <div className="glass-card rounded-full px-3 py-1.5 flex items-center gap-1.5">
              <span className="text-base">💎</span>
              <span className="text-cyan-300 font-bold text-sm">{student.points}</span>
              <span className="text-slate-400 text-xs">星钻</span>
            </div>
          </div>
        </div>

        {/* XP bar */}
        <div className="glass-card rounded-2xl p-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-purple-300 font-semibold">⚡ 星能 {xpCurrent} / {xpNeeded}</span>
            <span className="text-slate-400">→ Lv.{student.level + 1}</span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden relative">
            <div className="xp-bar-fill h-full rounded-full" style={{ width: `${xpPct}%` }} />
          </div>
        </div>
      </div>

      {/* ── 进度概览 ── */}
      <div className="px-4 mb-3">
        <div className={`glass-card rounded-2xl p-4 flex items-center gap-4 transition-all ${
          allDone ? "border-green-500/40" : ""
        }`}
          style={allDone ? { boxShadow: "0 0 20px rgba(16,185,129,0.2)" } : {}}>
          {/* 环形进度 */}
          <div className="relative w-16 h-16 shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5"/>
              <circle cx="32" cy="32" r="26" fill="none" stroke="url(#prog)"
                strokeWidth="5"
                strokeDasharray={`${2 * Math.PI * 26}`}
                strokeDashoffset={`${2 * Math.PI * 26 * (1 - pct / 100)}`}
                strokeLinecap="round" className="transition-all duration-1000"/>
              <defs>
                <linearGradient id="prog" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#a855f7"/>
                  <stop offset="100%" stopColor="#06b6d4"/>
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
              {pct}%
            </span>
          </div>

          <div className="flex-1">
            <p className="text-white font-bold text-lg leading-none">
              {completed}
              <span className="text-slate-400 font-normal text-sm"> / {total} 完成</span>
            </p>
            <p className="text-slate-400 text-xs mt-0.5">今日学习任务</p>
            {allDone && (
              <p className="text-green-400 text-xs font-semibold mt-1.5 sparkle">
                🎉 全部完成！太棒了！
              </p>
            )}
            {total === 0 && (
              <p className="text-slate-500 text-xs mt-1">让家长添加今日任务 →</p>
            )}
          </div>
          <div className="ml-auto">
            <p className={`text-3xl ${allDone ? "sparkle" : "float-slow"}`}>
              {allDone ? "🌟" : "🚀"}
            </p>
          </div>
        </div>
      </div>

      {/* ── 任务列表 ── */}
      <div className="px-4 space-y-5 pb-4">
        {total === 0 ? (
          /* 空状态 */
          <div className="glass-card rounded-3xl p-8 text-center">
            <p className="text-5xl mb-4 float">🌌</p>
            <p className="text-slate-200 font-bold text-lg">今日任务空空如也</p>
            <p className="text-slate-500 text-sm mt-2 leading-relaxed">
              切换到「家长」标签，<br/>设置每日固定任务或添加今日任务
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <div className="glass-card-purple rounded-xl px-4 py-2 text-xs text-purple-300">
                ⚡ 完成任务获得星能
              </div>
              <div className="glass-card-gold rounded-xl px-4 py-2 text-xs text-amber-400">
                💎 累积星钻换奖励
              </div>
            </div>
          </div>
        ) : (
          Object.entries(grouped).map(([subject, subjectTasks]) => {
            const cfg = subjectConfig[subject] ?? subjectConfig["语文"];
            const subDone = subjectTasks.filter((t) => t.completed).length;
            return (
              <div key={subject} className="slide-up">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{cfg.icon}</span>
                  <span className="text-white font-semibold text-sm">{subject}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.badge}`}>
                    {subDone}/{subjectTasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {subjectTasks.map((task) => (
                    <TaskCard key={task.id} task={task}
                      onComplete={handleComplete} isLoading={completingId === task.id} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── 奖励弹窗 ── */}
      {reward && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="reward-popup glass-card glow-purple rounded-3xl px-10 py-8 text-center">
            {reward.levelUp ? (
              <><p className="text-4xl mb-2 sparkle">🎊</p>
                <p className="text-yellow-400 font-bold text-xl mb-1">升级了！</p></>
            ) : (
              <p className="text-4xl mb-2">⚡</p>
            )}
            <p className="text-gradient-purple font-black text-3xl">+{reward.xp}</p>
            <p className="text-purple-300 text-sm font-medium">星能</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-cyan-400 font-bold">+{reward.points}</span>
              <span className="text-cyan-300 text-sm">星钻</span>
            </div>
            {reward.streak >= 3 && (
              <p className="text-orange-400 text-xs mt-2">🔥 {reward.streak}天连续加成！</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, onComplete, isLoading }: {
  task: Task; onComplete: (id: string) => void; isLoading: boolean;
}) {
  const cfg = subjectConfig[task.subject]  ?? subjectConfig["语文"];
  const dif = difficultyConfig[task.difficulty] ?? difficultyConfig["普通"];

  return (
    <div className={`glass-card rounded-2xl p-3.5 transition-all duration-300 ${
      task.completed ? "opacity-50" : ""
    }`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>{task.type}</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full ${dif.badge}`}>{dif.label}</span>
          </div>
          <p className={`font-semibold text-sm leading-snug ${
            task.completed ? "line-through text-slate-500" : "text-slate-100"
          }`}>{task.title}</p>
          {task.description && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{task.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-slate-500">⏱ {task.estimatedMinutes}分</span>
            <span className="text-xs text-purple-400 font-medium">⚡+{task.xpReward}</span>
            <span className="text-xs text-cyan-400 font-medium">💎+{task.pointReward}</span>
          </div>
        </div>

        <button
          onClick={() => !task.completed && onComplete(task.id)}
          disabled={task.completed || isLoading}
          className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
            task.completed ? "btn-done cursor-default"
            : isLoading   ? "glass-card animate-pulse"
            : "btn-complete"
          }`}
          aria-label={task.completed ? "已完成" : "完成任务"}
        >
          {task.completed ? (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
          ) : isLoading ? (
            <svg className="w-4 h-4 text-purple-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
