"use client";
import { useState } from "react";
import { subjectConfig } from "@/lib/utils";

interface Task { id: string; title: string; subject: string; type: string; difficulty: string; xpReward: number; pointReward: number; estimatedMinutes: number; description: string | null; completed: boolean; }
interface Completion { id: string; completedAt: string; task: { title: string; subject: string; xpReward: number }; }
interface Student { name: string; grade: number; xp: number; points: number; level: number; streak: number; lastCheckin?: string | null; createdAt?: string; }
interface Reward { id: string; title: string; description: string | null; emoji: string; cost: number; stock: number; }
interface Claim { id: string; status: string; claimedAt: string; reward: Reward; }

const SUBJECTS = ["语文","数学","英语","科学"];
const TYPES    = ["打卡","练习","背诵"];
const DIFFS    = ["普通","选做","挑战"];
const EMOJIS   = ["🎮","📚","🎬","🍕","🏖️","🎠","🏆","🎁","🎪","⚽","🎯","🛒"];

const defaultTaskForm  = { title:"", subject:"语文", type:"练习", difficulty:"普通", estimatedMinutes:"20", description:"" };
const defaultRewardForm = { title:"", description:"", emoji:"🎁", cost:"50", stock:"-1" };

type ParentTab = "tasks" | "rewards" | "claims";

export default function ParentClient({ student, todayTasks, recentCompletions, rewards: initRewards, pendingClaims: initClaims }: {
  student: Student;
  todayTasks: Task[];
  recentCompletions: Completion[];
  rewards: Reward[];
  pendingClaims: Claim[];
}) {
  const [activeTab, setActiveTab] = useState<ParentTab>("tasks");
  const [tasks, setTasks]     = useState(todayTasks);
  const [rewards, setRewards] = useState(initRewards);
  const [claims, setClaims]   = useState(initClaims);

  const [showTaskForm,   setShowTaskForm]   = useState(false);
  const [showRewardForm, setShowRewardForm] = useState(false);
  const [taskForm,   setTaskForm]   = useState(defaultTaskForm);
  const [rewardForm, setRewardForm] = useState(defaultRewardForm);

  const [submittingTask,   setSubmittingTask]   = useState(false);
  const [submittingReward, setSubmittingReward] = useState(false);
  const [deletingTaskId,   setDeletingTaskId]   = useState<string | null>(null);
  const [deletingRewardId, setDeletingRewardId] = useState<string | null>(null);
  const [approvingId,      setApprovingId]      = useState<string | null>(null);

  const [toast, setToast] = useState<{ msg: string; ok?: boolean } | null>(null);

  const completed = tasks.filter((t) => t.completed).length;
  const total     = tasks.length;

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  // ── 任务 ────────────────────────────────────────────────
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    setSubmittingTask(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...taskForm, estimatedMinutes: parseInt(taskForm.estimatedMinutes) || 20 }),
      });
      if (res.ok) {
        const t = await res.json();
        setTasks((prev) => [...prev, { ...t, completed: false }]);
        setTaskForm(defaultTaskForm); setShowTaskForm(false); showToast("✅ 任务已添加");
      }
    } finally { setSubmittingTask(false); }
  };

  const handleDeleteTask = async (id: string) => {
    setDeletingTaskId(id);
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (res.ok) { setTasks((prev) => prev.filter((t) => t.id !== id)); showToast("🗑️ 任务已删除"); }
    } finally { setDeletingTaskId(null); }
  };

  // ── 奖励 ────────────────────────────────────────────────
  const handleAddReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardForm.title.trim()) return;
    setSubmittingReward(true);
    try {
      const res = await fetch("/api/rewards", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...rewardForm, cost: parseInt(rewardForm.cost) || 50 }),
      });
      if (res.ok) {
        const r = await res.json();
        setRewards((prev) => [...prev, r]);
        setRewardForm(defaultRewardForm); setShowRewardForm(false); showToast("🎁 奖励已添加");
      }
    } finally { setSubmittingReward(false); }
  };

  const handleDeleteReward = async (id: string) => {
    setDeletingRewardId(id);
    try {
      const res = await fetch(`/api/rewards/${id}`, { method: "DELETE" });
      if (res.ok) { setRewards((prev) => prev.filter((r) => r.id !== id)); showToast("🗑️ 奖励已删除"); }
    } finally { setDeletingRewardId(null); }
  };

  // ── 审批 ────────────────────────────────────────────────
  const handleApprove = async (claimId: string, action: "approve" | "reject") => {
    setApprovingId(claimId);
    try {
      const res = await fetch("/api/rewards/claims", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId, action }),
      });
      if (res.ok) {
        setClaims((prev) => prev.filter((c) => c.id !== claimId));
        showToast(action === "approve" ? "✅ 已批准！" : "❌ 已拒绝，星钻已退还");
      }
    } finally { setApprovingId(null); }
  };

  const inputCls = "w-full glass-card rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500 placeholder-slate-600";

  return (
    <div className="flex flex-col min-h-screen text-slate-100">
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🌙</span>
          <h1 className="text-white text-xl font-bold">家长中心</h1>
        </div>
        <p className="text-slate-500 text-sm ml-9">管理 {student.name} 的学习与奖励</p>
      </div>

      {/* 今日概况 */}
      <div className="px-4 mb-4">
        <div className="glass-card-purple rounded-2xl p-4">
          <h2 className="text-purple-300 font-semibold text-sm mb-3">📊 今日概况</h2>
          <div className="grid grid-cols-4 gap-2">
            {[
              { l:"任务",   v: total+"个"  },
              { l:"完成",   v: completed+"个" },
              { l:"连续",   v: student.streak+"天" },
              { l:"星钻",   v: "💎"+student.points },
            ].map((s) => (
              <div key={s.l} className="glass-card rounded-xl p-2 text-center">
                <p className="text-white font-black text-base leading-tight">{s.v}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="px-4 mb-4">
        <div className="glass-card rounded-xl p-1 flex gap-1">
          {([
            { key: "tasks",   label: "今日任务", icon: "📋" },
            { key: "rewards", label: "奖励设置", icon: "🎁" },
            { key: "claims",  label: "待审批",   icon: "⏳", badge: claims.length },
          ] as const).map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                activeTab === t.key ? "btn-complete text-white" : "text-slate-400"
              }`}>
              <span>{t.icon}</span>
              {t.label}
              {"badge" in t && t.badge > 0 && (
                <span className="w-4 h-4 rounded-full bg-yellow-500 text-white text-[9px] flex items-center justify-center font-bold">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-8 flex-1 space-y-3">

        {/* ── 任务 Tab ── */}
        {activeTab === "tasks" && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-white font-bold text-sm">今日任务 ({total})</span>
              <button onClick={() => setShowTaskForm(!showTaskForm)}
                className="btn-complete px-4 py-1.5 rounded-full text-white text-xs font-semibold">
                ＋ 新增
              </button>
            </div>

            {showTaskForm && (
              <form onSubmit={handleAddTask} className="glass-card rounded-2xl p-4 space-y-3">
                <h3 className="text-purple-300 font-semibold text-sm">✦ 添加新任务</h3>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">任务名称 *</label>
                  <input value={taskForm.title} onChange={(e) => setTaskForm({...taskForm,title:e.target.value})}
                    placeholder="例：背诵第3单元单词" required className={inputCls}/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">学科</label>
                    <select value={taskForm.subject} onChange={(e)=>setTaskForm({...taskForm,subject:e.target.value})} className={inputCls}>
                      {SUBJECTS.map((s)=><option key={s} style={{background:"#1e1e3a"}}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">类型</label>
                    <select value={taskForm.type} onChange={(e)=>setTaskForm({...taskForm,type:e.target.value})} className={inputCls}>
                      {TYPES.map((t)=><option key={t} style={{background:"#1e1e3a"}}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">难度</label>
                    <select value={taskForm.difficulty} onChange={(e)=>setTaskForm({...taskForm,difficulty:e.target.value})} className={inputCls}>
                      {DIFFS.map((d)=><option key={d} style={{background:"#1e1e3a"}}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">预计时长(分)</label>
                    <input type="number" value={taskForm.estimatedMinutes} min="5" max="120"
                      onChange={(e)=>setTaskForm({...taskForm,estimatedMinutes:e.target.value})} className={inputCls}/>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">备注（可选）</label>
                  <input value={taskForm.description} onChange={(e)=>setTaskForm({...taskForm,description:e.target.value})}
                    placeholder="例：完成课本第45页" className={inputCls}/>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={()=>{setShowTaskForm(false);setTaskForm(defaultTaskForm);}}
                    className="flex-1 glass-card rounded-xl py-2.5 text-sm text-slate-400">取消</button>
                  <button type="submit" disabled={submittingTask}
                    className="flex-1 btn-complete rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-60">
                    {submittingTask ? "添加中..." : "确认添加"}
                  </button>
                </div>
              </form>
            )}

            {tasks.length === 0 ? (
              <div className="glass-card rounded-2xl p-6 text-center">
                <p className="text-3xl mb-2">🌌</p>
                <p className="text-slate-500 text-sm">还没有今日任务</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => {
                  const cfg = subjectConfig[task.subject] ?? subjectConfig["语文"];
                  const isDeleting = deletingTaskId === task.id;
                  return (
                    <div key={task.id} className={`glass-card rounded-xl px-3 py-3 flex items-center gap-3 transition-all ${task.completed?"opacity-60":""} ${isDeleting?"scale-95 opacity-30":""}`}>
                      <span className="w-8 h-8 rounded-full glass-card flex items-center justify-center text-sm shrink-0">
                        {task.completed ? "✓" : cfg.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${task.completed?"line-through text-slate-500":"text-slate-200"}`}>{task.title}</p>
                        <p className="text-xs text-slate-500">{task.subject} · {task.difficulty} · {task.estimatedMinutes}分</p>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-full font-medium shrink-0 ${task.completed?"glass-card-green text-green-400":"glass-card text-slate-400"}`}>
                        {task.completed ? "✓完成" : "待做"}
                      </span>
                      {!task.completed && (
                        <button onClick={() => handleDeleteTask(task.id)} disabled={isDeleting}
                          className="w-6 h-6 rounded-full glass-card-pink text-red-400 flex items-center justify-center text-xs shrink-0 active:scale-90">
                          {isDeleting ? "…" : "✕"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 最近打卡 */}
            {recentCompletions.length > 0 && (
              <div>
                <p className="text-sm font-bold text-white mb-2 mt-2">最近打卡</p>
                <div className="space-y-2">
                  {recentCompletions.map((c) => {
                    const cfg = subjectConfig[c.task.subject] ?? subjectConfig["语文"];
                    return (
                      <div key={c.id} className="glass-card rounded-xl px-3 py-2.5 flex items-center gap-3">
                        <span className="text-lg">{cfg.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-300 truncate">{c.task.title}</p>
                          <p className="text-[10px] text-slate-500">
                            {new Date(c.completedAt).toLocaleDateString("zh-CN",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}
                          </p>
                        </div>
                        <span className="text-xs text-purple-400">⚡+{c.task.xpReward}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── 奖励设置 Tab ── */}
        {activeTab === "rewards" && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-white font-bold text-sm">奖励商品 ({rewards.length})</span>
              <button onClick={() => setShowRewardForm(!showRewardForm)}
                className="btn-complete px-4 py-1.5 rounded-full text-white text-xs font-semibold">
                ＋ 添加奖励
              </button>
            </div>

            {showRewardForm && (
              <form onSubmit={handleAddReward} className="glass-card rounded-2xl p-4 space-y-3">
                <h3 className="text-yellow-400 font-semibold text-sm">🎁 添加新奖励</h3>

                {/* Emoji 选择 */}
                <div>
                  <label className="text-xs text-slate-500 block mb-2">选择图标</label>
                  <div className="flex flex-wrap gap-2">
                    {EMOJIS.map((e) => (
                      <button key={e} type="button"
                        onClick={() => setRewardForm({...rewardForm, emoji: e})}
                        className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all ${
                          rewardForm.emoji === e ? "glass-card-gold glow-gold scale-110" : "glass-card"
                        }`}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-500 block mb-1">奖励名称 *</label>
                  <input value={rewardForm.title} onChange={(e) => setRewardForm({...rewardForm,title:e.target.value})}
                    placeholder="例：出去游乐场玩、买一本新书..." required className={inputCls}/>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">详细说明（可选）</label>
                  <input value={rewardForm.description} onChange={(e) => setRewardForm({...rewardForm,description:e.target.value})}
                    placeholder="例：周末去最近的游乐场玩半天" className={inputCls}/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">所需星钻 💎</label>
                    <input type="number" value={rewardForm.cost} min="1"
                      onChange={(e) => setRewardForm({...rewardForm,cost:e.target.value})} className={inputCls}/>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">库存次数</label>
                    <select value={rewardForm.stock} onChange={(e) => setRewardForm({...rewardForm,stock:e.target.value})} className={inputCls}>
                      <option value="-1" style={{background:"#1e1e3a"}}>不限次数</option>
                      <option value="1"  style={{background:"#1e1e3a"}}>仅1次</option>
                      <option value="3"  style={{background:"#1e1e3a"}}>3次</option>
                      <option value="5"  style={{background:"#1e1e3a"}}>5次</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setShowRewardForm(false); setRewardForm(defaultRewardForm); }}
                    className="flex-1 glass-card rounded-xl py-2.5 text-sm text-slate-400">取消</button>
                  <button type="submit" disabled={submittingReward}
                    className="flex-1 btn-complete rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-60">
                    {submittingReward ? "添加中..." : "确认添加"}
                  </button>
                </div>
              </form>
            )}

            {rewards.length === 0 ? (
              <div className="glass-card rounded-2xl p-6 text-center">
                <p className="text-4xl mb-2">🎁</p>
                <p className="text-slate-400 text-sm">还没有奖励，点击添加激励孩子吧</p>
              </div>
            ) : (
              <div className="space-y-2">
                {rewards.map((r) => {
                  const isDeleting = deletingRewardId === r.id;
                  return (
                    <div key={r.id} className={`glass-card rounded-xl px-3 py-3 flex items-center gap-3 transition-all ${isDeleting?"scale-95 opacity-30":""}`}>
                      <span className="text-2xl w-10 text-center shrink-0">{r.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{r.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-cyan-400 font-semibold">💎{r.cost}</span>
                          {r.description && <span className="text-[10px] text-slate-500 truncate">{r.description}</span>}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0">{r.stock === -1 ? "不限" : `×${r.stock}`}</span>
                      <button onClick={() => handleDeleteReward(r.id)} disabled={isDeleting}
                        className="w-6 h-6 rounded-full glass-card-pink text-red-400 flex items-center justify-center text-xs shrink-0 active:scale-90">
                        {isDeleting ? "…" : "✕"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── 待审批 Tab ── */}
        {activeTab === "claims" && (
          <>
            {claims.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center">
                <p className="text-4xl mb-2">✅</p>
                <p className="text-slate-300 font-semibold">没有待审批的申请</p>
                <p className="text-slate-500 text-sm mt-1">孩子兑换奖励后会出现在这里</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-yellow-400 font-semibold">有 {claims.length} 条申请等待处理</p>
                {claims.map((c) => {
                  const isProcessing = approvingId === c.id;
                  return (
                    <div key={c.id} className="glass-card-gold rounded-2xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">{c.reward.emoji}</span>
                        <div className="flex-1">
                          <p className="font-bold text-slate-100">{c.reward.title}</p>
                          <p className="text-xs text-slate-400">
                            💎{c.reward.cost} 星钻 ·{" "}
                            {new Date(c.claimedAt).toLocaleDateString("zh-CN",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(c.id, "reject")}
                          disabled={isProcessing}
                          className="flex-1 glass-card-pink rounded-xl py-2.5 text-red-400 text-sm font-semibold active:scale-95 transition-all disabled:opacity-50">
                          ✗ 拒绝
                        </button>
                        <button
                          onClick={() => handleApprove(c.id, "approve")}
                          disabled={isProcessing}
                          className="flex-1 glass-card-green rounded-xl py-2.5 text-green-400 text-sm font-bold active:scale-95 transition-all disabled:opacity-50 glow-green">
                          {isProcessing ? "处理中..." : "✓ 批准"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-semibold z-50 ${
          toast.ok !== false ? "glass-card-green glow-green text-green-300" : "glass-card-pink text-red-300"
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
