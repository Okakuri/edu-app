"use client";
import { useState, useRef, useCallback } from "react";
import Mascot, { MascotMood } from "@/components/Mascot";
import ParticleCanvas, { ParticleCanvasRef } from "@/components/ParticleCanvas";
import { subjectConfig, difficultyConfig, getLevelTitle, getLevelEmoji, xpForNextLevel } from "@/lib/utils";

interface Task {
  id: string; title: string; subject: string; type: string; difficulty: string;
  xpReward: number; pointReward: number; estimatedMinutes: number;
  description: string | null; completed: boolean;
}
interface Student {
  name: string; grade: number; xp: number; points: number; level: number; streak: number;
}
interface RewardInfo { xp: number; points: number; levelUp: boolean; streak: number }

function playBeep(type: "correct" | "wrong" | "complete" = "correct") {
  if (typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    if (type === "correct") {
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(); osc.stop(ctx.currentTime + 0.5);
    } else if (type === "complete") {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(554, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.2);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      osc.start(); osc.stop(ctx.currentTime + 0.7);
    }
  } catch (_) {}
}

const GREETINGS = ["加油！", "继续冲！", "你最棒！", "今天也要努力！", "冲冲冲！"];
const SUBJECT_BORDER: Record<string, string> = {
  语文: "border-l-[#ff7043]", 数学: "border-l-[#5c6bc0]",
  英语: "border-l-[#26a69a]", 科学: "border-l-[#ab47bc]",
};

export default function DashboardClient({
  student: init, initialTasks,
}: { student: Student; initialTasks: Task[] }) {
  const [tasks, setTasks]         = useState(initialTasks);
  const [student, setStudent]     = useState(init);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [reward, setReward]       = useState<RewardInfo | null>(null);
  const [mascotMood, setMascotMood] = useState<MascotMood>("idle");
  const [xpDisplay, setXpDisplay] = useState(init.xp);
  const [greeting]                = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
  const particleRef               = useRef<ParticleCanvasRef | null>(null);

  const completed = tasks.filter(t => t.completed).length;
  const total     = tasks.length;
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;
  const allDone   = total > 0 && completed === total;

  const xpNeeded  = xpForNextLevel(student.level);
  const xpBase    = student.level * (student.level - 1) * 50;
  const xpCurrent = Math.max(0, xpDisplay - xpBase);
  const xpPct     = Math.min(Math.round((xpCurrent / xpNeeded) * 100), 100);

  const today = new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" });

  const grouped: Record<string, Task[]> = {};
  for (const t of tasks) {
    if (!grouped[t.subject]) grouped[t.subject] = [];
    grouped[t.subject].push(t);
  }

  const handleComplete = useCallback(async (taskId: string) => {
    if (completingId) return;
    setCompletingId(taskId);
    try {
      const res  = await fetch(`/api/tasks/${taskId}/complete`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) return;

      // 更新任务状态
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true } : t));

      // 吉祥物庆祝
      setMascotMood("cheer");
      setTimeout(() => setMascotMood("idle"), 1500);

      // 粒子爆炸 + 音效
      particleRef.current?.burst(undefined, undefined, data.levelUp ? 100 : 60);
      playBeep(data.levelUp ? "complete" : "correct");

      // XP 滚动更新
      const steps = 8;
      const diff  = data.newXp - xpDisplay;
      for (let i = 1; i <= steps; i++) {
        setTimeout(() => setXpDisplay(Math.round(xpDisplay + (diff * i) / steps)), i * 60);
      }

      setStudent(prev => ({
        ...prev, xp: data.newXp, points: data.newPoints,
        level: data.newLevel, streak: data.newStreak,
      }));
      setReward({ xp: data.xpGained, points: data.pointsGained, levelUp: data.levelUp, streak: data.newStreak });
      setTimeout(() => setReward(null), 3000);
    } finally {
      setCompletingId(null);
    }
  }, [completingId, xpDisplay]);

  return (
    <div className="relative flex flex-col min-h-screen" style={{ color: "var(--text-1)" }}>
      <div className="page-bg" />
      <ParticleCanvas onRef={r => { particleRef.current = r; }} />

      {/* ── Header ── */}
      <div className="relative z-10 px-4 pt-12 pb-3">
        <div className="flex items-start justify-between">
          {/* 左：问候 + 等级 */}
          <div className="flex-1">
            <p className="text-xs mb-0.5" style={{ color: "var(--text-3)" }}>{today}</p>
            <h1 className="font-black text-xl leading-tight" style={{ color: "var(--text-1)" }}>
              {student.name}，{greeting}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-base">{getLevelEmoji(student.level)}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(124,77,255,0.2)", color: "#b39ddb" }}>
                Lv.{student.level} {getLevelTitle(student.level)}
              </span>
            </div>
          </div>

          {/* 右：吉祥物 */}
          <div className="relative">
            <Mascot mood={mascotMood} size={72} />
          </div>
        </div>

        {/* 状态胶囊 */}
        <div className="flex gap-2 mt-3">
          <div className="stat-pill flex items-center gap-1.5 flex-1">
            <span className="streak-fire text-lg">🔥</span>
            <span className="font-black text-base" style={{ color: "#ff8a65" }}>{student.streak}</span>
            <span className="text-xs" style={{ color: "var(--text-3)" }}>天连续</span>
          </div>
          <div className="stat-pill flex items-center gap-1.5 flex-1">
            <span className="text-lg">💎</span>
            <span className="font-black text-base" style={{ color: "#4fc3f7" }}>{student.points}</span>
            <span className="text-xs" style={{ color: "var(--text-3)" }}>星钻</span>
          </div>
          <div className="stat-pill flex items-center gap-1.5 flex-1">
            <span className="text-lg">⚡</span>
            <span className="font-black text-base num-roll" key={xpCurrent} style={{ color: "#ce93d8" }}>{xpCurrent}</span>
            <span className="text-xs" style={{ color: "var(--text-3)" }}>/{xpNeeded}</span>
          </div>
        </div>

        {/* XP 进度条 */}
        <div className="mt-2">
          <div className="xp-track h-3">
            <div className="xp-fill h-full" style={{ width: `${xpPct}%` }} />
          </div>
        </div>
      </div>

      {/* ── 今日进度卡 ── */}
      <div className="relative z-10 px-4 mb-4">
        <div className={`card p-4 flex items-center gap-4 transition-all duration-500 ${allDone ? "border-green-500/30" : ""}`}>
          {/* 圆形进度 */}
          <div className="relative shrink-0" style={{ width: 64, height: 64 }}>
            <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
              <circle className="ring-track" cx="32" cy="32" r="26" strokeWidth="5"/>
              <circle className="ring-fill" cx="32" cy="32" r="26" strokeWidth="5"
                stroke={allDone ? "#66bb6a" : "#7c4dff"}
                strokeDasharray={`${2 * Math.PI * 26}`}
                strokeDashoffset={`${2 * Math.PI * 26 * (1 - pct / 100)}`}/>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-black"
              style={{ color: allDone ? "#a5d6a7" : "var(--text-1)" }}>
              {pct}%
            </span>
          </div>

          <div className="flex-1">
            <p className="font-black text-xl leading-none" style={{ color: "var(--text-1)" }}>
              {completed}<span className="font-normal text-sm" style={{ color: "var(--text-2)" }}> / {total}</span>
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>今日任务</p>
            {allDone && (
              <p className="text-xs font-bold mt-1.5" style={{ color: "#a5d6a7", animation: "mascotCheer 0.8s ease-in-out infinite" }}>
                🎉 全部完成！太棒了！
              </p>
            )}
            {total === 0 && (
              <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>让家长添加今日任务 →</p>
            )}
          </div>
        </div>
      </div>

      {/* ── 任务列表 ── */}
      <div className="relative z-10 px-4 space-y-5 pb-6">
        {total === 0 ? (
          <div className="card p-8 text-center">
            <Mascot mood="think" size={80} className="mx-auto mb-4" />
            <p className="font-bold text-base" style={{ color: "var(--text-1)" }}>今日任务空空如也</p>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--text-3)" }}>
              切换到「家长」标签，<br/>设置每日固定任务或添加今日任务
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([subject, subjectTasks]) => {
            const cfg  = subjectConfig[subject] ?? subjectConfig["语文"];
            const done = subjectTasks.filter(t => t.completed).length;
            return (
              <div key={subject} className="slide-up">
                {/* 学科标题 */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{cfg.icon}</span>
                  <span className="font-bold text-sm" style={{ color: "var(--text-1)" }}>{subject}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.badge}`}>{done}/{subjectTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {subjectTasks.map(task => (
                    <TaskCard key={task.id} task={task} subject={subject}
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
          <div className="reward-pop card p-8 text-center mx-6"
            style={{ boxShadow: "0 0 40px rgba(124,77,255,0.5)", borderColor: "rgba(124,77,255,0.4)" }}>
            <Mascot mood="cheer" size={72} className="mx-auto mb-3" />
            {reward.levelUp && (
              <p className="font-black text-lg mb-1" style={{ color: "#ffd54f" }}>升级了！🎊</p>
            )}
            <p className="font-black text-4xl" style={{ color: "#ce93d8" }}>+{reward.xp}</p>
            <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--text-3)" }}>星能</p>
            <p className="font-bold text-lg mt-2" style={{ color: "#4fc3f7" }}>+{reward.points} 💎</p>
            {reward.streak >= 3 && (
              <p className="text-xs mt-2 font-semibold" style={{ color: "#ff8a65" }}>
                🔥 {reward.streak}天连续加成！
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, subject, onComplete, isLoading }: {
  task: Task; subject: string;
  onComplete: (id: string) => void; isLoading: boolean;
}) {
  const cfg = subjectConfig[task.subject] ?? subjectConfig["语文"];
  const dif = difficultyConfig[task.difficulty] ?? difficultyConfig["普通"];
  const borderColor = { 语文: "#ff7043", 数学: "#5c6bc0", 英语: "#26a69a", 科学: "#ab47bc" }[subject] ?? "#7c4dff";

  return (
    <div
      className="task-card"
      style={{ borderLeft: `4px solid ${borderColor}${task.completed ? "60" : ""}` }}
    >
      <div className="flex items-start gap-3 p-3.5">
        <div className="flex-1 min-w-0">
          {/* 标签行 */}
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${cfg.badge}`}>{task.type}</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full ${dif.badge}`}>{dif.label}</span>
          </div>
          {/* 标题 */}
          <p className={`font-bold text-sm leading-snug ${task.completed ? "line-through" : ""}`}
            style={{ color: task.completed ? "var(--text-3)" : "var(--text-1)" }}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-3)" }}>{task.description}</p>
          )}
          {/* 底部信息 */}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs" style={{ color: "var(--text-3)" }}>⏱ {task.estimatedMinutes}分</span>
            <span className="text-xs font-semibold" style={{ color: "#b39ddb" }}>⚡+{task.xpReward}</span>
            <span className="text-xs font-semibold" style={{ color: "#4fc3f7" }}>💎+{task.pointReward}</span>
          </div>
        </div>

        {/* 完成按钮 */}
        {task.completed ? (
          <div className="btn-complete-done">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
          </div>
        ) : isLoading ? (
          <div className="btn-complete opacity-60">
            <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        ) : (
          <button className="btn-complete" onClick={() => onComplete(task.id)} aria-label="完成任务">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
