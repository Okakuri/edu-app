"use client";
import { useState } from "react";
import { subjectConfig } from "@/lib/utils";

interface Task      { id: string; title: string; subject: string; type: string; difficulty: string; xpReward: number; pointReward: number; estimatedMinutes: number; description: string | null; completed: boolean; }
interface Template  { id: string; title: string; subject: string; type: string; difficulty: string; xpReward: number; estimatedMinutes: number; description: string | null; }
interface Completion{ id: string; completedAt: string; task: { title: string; subject: string; xpReward: number }; }
interface Student   { name: string; grade: number; xp: number; points: number; level: number; streak: number; lastCheckin?: string | null; createdAt?: string; }
interface Reward    { id: string; title: string; description: string | null; emoji: string; cost: number; stock: number; }
interface Claim     { id: string; status: string; claimedAt: string; reward: Reward; }

const SUBJECTS = ["语文","数学","英语","科学"];
const TYPES    = ["打卡","练习","背诵"];
const DIFFS    = ["普通","选做","挑战"];
const EMOJIS   = ["🎮","📚","🎬","🍕","🏖️","🎠","🏆","🎁","🎪","⚽","🎯","🛒"];
const GRADES   = [1,2,3,4,5,6];

const blankTask   = { title:"", subject:"语文", type:"练习", difficulty:"普通", estimatedMinutes:"20", description:"" };
const blankReward = { title:"", description:"", emoji:"🎁", cost:"50", stock:"-1" };

type Tab = "tasks" | "templates" | "rewards" | "claims" | "settings";

export default function ParentClient({ student: initStudent, todayTasks, recentCompletions, rewards: initRewards, pendingClaims: initClaims, templates: initTemplates }: {
  student: Student; todayTasks: Task[]; recentCompletions: Completion[];
  rewards: Reward[]; pendingClaims: Claim[]; templates: Template[];
}) {
  const [tab,       setTab]       = useState<Tab>("tasks");
  const [student,   setStudent]   = useState(initStudent);
  const [tasks,     setTasks]     = useState(todayTasks);
  const [templates, setTemplates] = useState(initTemplates);
  const [rewards,   setRewards]   = useState(initRewards);
  const [claims,    setClaims]    = useState(initClaims);

  const [showTaskForm,    setShowTaskForm]    = useState(false);
  const [showTplForm,     setShowTplForm]     = useState(false);
  const [showRewardForm,  setShowRewardForm]  = useState(false);
  const [taskForm,        setTaskForm]        = useState(blankTask);
  const [tplForm,         setTplForm]         = useState(blankTask);
  const [rewardForm,      setRewardForm]      = useState(blankReward);
  const [nameInput,       setNameInput]       = useState(initStudent.name);
  const [gradeInput,      setGradeInput]      = useState(String(initStudent.grade));

  const [busy,        setBusy]        = useState(false);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [toast,       setToast]       = useState<{ msg: string; ok?: boolean } | null>(null);

  const completed = tasks.filter((t) => t.completed).length;
  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 2500); };

  const inputCls = "w-full glass-card rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500 placeholder-slate-600";

  // ── 今日临时任务 ──────────────────────────────────────────
  const addTask = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      const res = await fetch("/api/tasks", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ ...taskForm, estimatedMinutes: parseInt(taskForm.estimatedMinutes)||20 }) });
      if (res.ok) { const t = await res.json(); setTasks(p => [...p, {...t, completed:false}]); setTaskForm(blankTask); setShowTaskForm(false); showToast("✅ 任务已添加"); }
    } finally { setBusy(false); }
  };

  const deleteTask = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/tasks/${id}`, { method:"DELETE" });
      if (res.ok) { setTasks(p => p.filter(t => t.id !== id)); showToast("🗑️ 已删除"); }
    } finally { setDeletingId(null); }
  };

  // ── 固定任务模板 ──────────────────────────────────────────
  const addTemplate = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      const res = await fetch("/api/templates", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ ...tplForm, estimatedMinutes: parseInt(tplForm.estimatedMinutes)||20 }) });
      if (res.ok) { const t = await res.json(); setTemplates(p => [...p, t]); setTplForm(blankTask); setShowTplForm(false); showToast("📋 模板已添加，明天起生效"); }
    } finally { setBusy(false); }
  };

  const deleteTemplate = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/templates/${id}`, { method:"DELETE" });
      if (res.ok) { setTemplates(p => p.filter(t => t.id !== id)); showToast("🗑️ 模板已删除"); }
    } finally { setDeletingId(null); }
  };

  // ── 奖励 ──────────────────────────────────────────────────
  const addReward = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      const res = await fetch("/api/rewards", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ ...rewardForm, cost: parseInt(rewardForm.cost)||50 }) });
      if (res.ok) { const r = await res.json(); setRewards(p => [...p, r]); setRewardForm(blankReward); setShowRewardForm(false); showToast("🎁 奖励已添加"); }
    } finally { setBusy(false); }
  };

  const deleteReward = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/rewards/${id}`, { method:"DELETE" });
      if (res.ok) { setRewards(p => p.filter(r => r.id !== id)); showToast("🗑️ 已删除"); }
    } finally { setDeletingId(null); }
  };

  // ── 审批 ──────────────────────────────────────────────────
  const approve = async (claimId: string, action: "approve"|"reject") => {
    setApprovingId(claimId);
    try {
      const res = await fetch("/api/rewards/claims", { method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ claimId, action }) });
      if (res.ok) { setClaims(p => p.filter(c => c.id !== claimId)); showToast(action==="approve"?"✅ 已批准！":"❌ 已拒绝，星钻已退还"); }
    } finally { setApprovingId(null); }
  };

  // ── 设置 ──────────────────────────────────────────────────
  const saveSettings = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/student", { method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ name: nameInput.trim(), grade: parseInt(gradeInput) }) });
      if (res.ok) { const s = await res.json(); setStudent(prev => ({ ...prev, name: s.name, grade: s.grade })); showToast("✅ 设置已保存"); }
    } finally { setBusy(false); }
  };

  // ── Tab 配置 ──────────────────────────────────────────────
  const TABS: { key: Tab; label: string; icon: string; badge?: number }[] = [
    { key:"tasks",     label:"今日",   icon:"📋" },
    { key:"templates", label:"固定任务", icon:"🔄" },
    { key:"rewards",   label:"奖励",   icon:"🎁" },
    { key:"claims",    label:"审批",   icon:"⏳", badge: claims.length },
    { key:"settings",  label:"设置",   icon:"⚙️" },
  ];

  return (
    <div className="flex flex-col min-h-screen text-slate-100">
      {/* Header */}
      <div className="px-4 pt-12 pb-3">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-2xl">🌙</span>
          <h1 className="text-white text-xl font-bold">家长中心</h1>
        </div>
        <p className="text-slate-500 text-xs ml-9">管理 {student.name}（{student.grade}年级）的学习</p>
      </div>

      {/* 概况 */}
      <div className="px-4 mb-3">
        <div className="glass-card-purple rounded-2xl p-3">
          <div className="grid grid-cols-4 gap-2">
            {[
              { l:"任务",  v: tasks.length+"个"    },
              { l:"完成",  v: completed+"个"        },
              { l:"连续",  v: "🔥"+student.streak+"天" },
              { l:"星钻",  v: "💎"+student.points  },
            ].map((s) => (
              <div key={s.l} className="glass-card rounded-xl p-2 text-center">
                <p className="text-white font-black text-sm leading-tight">{s.v}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab 导航 */}
      <div className="px-4 mb-3">
        <div className="glass-card rounded-xl p-1 flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-shrink-0 py-2 px-2 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1 ${
                tab === t.key ? "btn-complete text-white" : "text-slate-400"
              }`}>
              <span>{t.icon}</span>{t.label}
              {t.badge != null && t.badge > 0 && (
                <span className="w-4 h-4 rounded-full bg-yellow-500 text-white text-[9px] flex items-center justify-center font-bold">{t.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-8 flex-1 space-y-3">

        {/* ── 今日任务 ── */}
        {tab === "tasks" && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-white font-bold text-sm">今日任务 ({tasks.length})</span>
              <button onClick={() => setShowTaskForm(!showTaskForm)}
                className="btn-complete px-3 py-1.5 rounded-full text-white text-xs font-semibold">+ 临时添加</button>
            </div>
            {showTaskForm && <TaskForm form={taskForm} setForm={setTaskForm} onSubmit={addTask} onCancel={() => { setShowTaskForm(false); setTaskForm(blankTask); }} busy={busy} inputCls={inputCls} title="添加今日任务" hint="仅今天有效" />}
            {tasks.length === 0 ? (
              <div className="glass-card rounded-2xl p-5 text-center">
                <p className="text-3xl mb-2">🌌</p>
                <p className="text-slate-500 text-sm">今日暂无任务</p>
                <p className="text-slate-600 text-xs mt-1">可在「固定任务」设置每日自动生成的任务</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((t) => {
                  const cfg = subjectConfig[t.subject] ?? subjectConfig["语文"];
                  const del = deletingId === t.id;
                  return (
                    <div key={t.id} className={`glass-card rounded-xl px-3 py-2.5 flex items-center gap-2.5 transition-all ${t.completed?"opacity-60":""} ${del?"scale-95 opacity-30":""}`}>
                      <span className="text-lg shrink-0">{t.completed ? "✓" : cfg.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${t.completed?"line-through text-slate-500":"text-slate-200"}`}>{t.title}</p>
                        <p className="text-xs text-slate-500">{t.subject} · {t.difficulty} · {t.estimatedMinutes}分</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${t.completed?"glass-card-green text-green-400":"glass-card text-slate-400"}`}>{t.completed?"✓完成":"待做"}</span>
                      {!t.completed && <button onClick={() => deleteTask(t.id)} disabled={del} className="w-6 h-6 rounded-full glass-card-pink text-red-400 flex items-center justify-center text-xs shrink-0">{del?"…":"✕"}</button>}
                    </div>
                  );
                })}
              </div>
            )}
            {recentCompletions.length > 0 && (
              <div className="pt-1">
                <p className="text-xs text-slate-500 font-semibold mb-2">最近打卡</p>
                <div className="space-y-1.5">
                  {recentCompletions.map((c) => {
                    const cfg = subjectConfig[c.task.subject] ?? subjectConfig["语文"];
                    return (
                      <div key={c.id} className="glass-card rounded-xl px-3 py-2 flex items-center gap-2.5">
                        <span className="text-base">{cfg.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-300 truncate">{c.task.title}</p>
                          <p className="text-[10px] text-slate-500">{new Date(c.completedAt).toLocaleDateString("zh-CN",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</p>
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

        {/* ── 固定任务模板 ── */}
        {tab === "templates" && (
          <>
            <div className="glass-card rounded-xl p-3 text-xs text-slate-400 leading-relaxed">
              🔄 这里的任务<span className="text-purple-300 font-semibold">每天自动生成</span>，不需要每天手动添加。新模板<span className="text-amber-400 font-semibold">明天起</span>生效。
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white font-bold text-sm">固定任务 ({templates.length})</span>
              <button onClick={() => setShowTplForm(!showTplForm)}
                className="btn-complete px-3 py-1.5 rounded-full text-white text-xs font-semibold">+ 添加模板</button>
            </div>
            {showTplForm && <TaskForm form={tplForm} setForm={setTplForm} onSubmit={addTemplate} onCancel={() => { setShowTplForm(false); setTplForm(blankTask); }} busy={busy} inputCls={inputCls} title="添加固定任务" hint="每天自动生成" />}
            {templates.length === 0 ? (
              <div className="glass-card rounded-2xl p-5 text-center">
                <p className="text-3xl mb-2">🔄</p>
                <p className="text-slate-400 text-sm">还没有固定任务模板</p>
                <p className="text-slate-600 text-xs mt-1">添加后每天自动出现在孩子的工作台</p>
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map((t) => {
                  const cfg = subjectConfig[t.subject] ?? subjectConfig["语文"];
                  const del = deletingId === t.id;
                  return (
                    <div key={t.id} className={`glass-card rounded-xl px-3 py-2.5 flex items-center gap-2.5 transition-all ${del?"scale-95 opacity-30":""}`}>
                      <span className="text-lg shrink-0">{cfg.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{t.title}</p>
                        <p className="text-xs text-slate-500">{t.subject} · {t.difficulty} · {t.estimatedMinutes}分</p>
                      </div>
                      <span className="text-xs text-purple-400 shrink-0">⚡{t.xpReward}</span>
                      <button onClick={() => deleteTemplate(t.id)} disabled={del} className="w-6 h-6 rounded-full glass-card-pink text-red-400 flex items-center justify-center text-xs shrink-0">{del?"…":"✕"}</button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── 奖励设置 ── */}
        {tab === "rewards" && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-white font-bold text-sm">奖励商品 ({rewards.length})</span>
              <button onClick={() => setShowRewardForm(!showRewardForm)}
                className="btn-complete px-3 py-1.5 rounded-full text-white text-xs font-semibold">+ 添加奖励</button>
            </div>
            {showRewardForm && (
              <form onSubmit={addReward} className="glass-card rounded-2xl p-4 space-y-3">
                <h3 className="text-yellow-400 font-semibold text-sm">🎁 添加奖励</h3>
                <div>
                  <label className="text-xs text-slate-500 block mb-2">选择图标</label>
                  <div className="flex flex-wrap gap-2">
                    {EMOJIS.map((e) => (
                      <button key={e} type="button" onClick={() => setRewardForm({...rewardForm,emoji:e})}
                        className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all ${rewardForm.emoji===e?"glass-card-gold glow-gold scale-110":"glass-card"}`}>{e}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">奖励名称 *</label>
                  <input value={rewardForm.title} onChange={(e)=>setRewardForm({...rewardForm,title:e.target.value})} placeholder="例：出去游乐场玩" required className={inputCls}/>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">详细说明（可选）</label>
                  <input value={rewardForm.description} onChange={(e)=>setRewardForm({...rewardForm,description:e.target.value})} placeholder="例：周末去最近的游乐场玩半天" className={inputCls}/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">所需星钻 💎</label>
                    <input type="number" value={rewardForm.cost} min="1" onChange={(e)=>setRewardForm({...rewardForm,cost:e.target.value})} className={inputCls}/>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">库存次数</label>
                    <select value={rewardForm.stock} onChange={(e)=>setRewardForm({...rewardForm,stock:e.target.value})} className={inputCls}>
                      <option value="-1" style={{background:"#1e1e3a"}}>不限次数</option>
                      <option value="1"  style={{background:"#1e1e3a"}}>仅1次</option>
                      <option value="3"  style={{background:"#1e1e3a"}}>3次</option>
                      <option value="5"  style={{background:"#1e1e3a"}}>5次</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={()=>{setShowRewardForm(false);setRewardForm(blankReward);}} className="flex-1 glass-card rounded-xl py-2.5 text-sm text-slate-400">取消</button>
                  <button type="submit" disabled={busy} className="flex-1 btn-complete rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-60">{busy?"添加中...":"确认添加"}</button>
                </div>
              </form>
            )}
            {rewards.length === 0 ? (
              <div className="glass-card rounded-2xl p-5 text-center"><p className="text-3xl mb-2">🎁</p><p className="text-slate-400 text-sm">还没有奖励，添加激励孩子吧</p></div>
            ) : (
              <div className="space-y-2">
                {rewards.map((r) => {
                  const del = deletingId === r.id;
                  return (
                    <div key={r.id} className={`glass-card rounded-xl px-3 py-2.5 flex items-center gap-2.5 transition-all ${del?"scale-95 opacity-30":""}`}>
                      <span className="text-2xl shrink-0">{r.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{r.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-cyan-400 font-semibold">💎{r.cost}</span>
                          {r.description && <span className="text-[10px] text-slate-500 truncate">{r.description}</span>}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0">{r.stock===-1?"不限":`×${r.stock}`}</span>
                      <button onClick={()=>deleteReward(r.id)} disabled={del} className="w-6 h-6 rounded-full glass-card-pink text-red-400 flex items-center justify-center text-xs shrink-0">{del?"…":"✕"}</button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── 待审批 ── */}
        {tab === "claims" && (
          claims.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <p className="text-4xl mb-2">✅</p>
              <p className="text-slate-300 font-semibold">没有待审批的申请</p>
              <p className="text-slate-500 text-sm mt-1">孩子兑换奖励后会出现在这里</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-yellow-400 font-semibold">有 {claims.length} 条申请等待处理</p>
              {claims.map((c) => {
                const busy2 = approvingId === c.id;
                return (
                  <div key={c.id} className="glass-card-gold rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{c.reward.emoji}</span>
                      <div className="flex-1">
                        <p className="font-bold text-slate-100">{c.reward.title}</p>
                        <p className="text-xs text-slate-400">💎{c.reward.cost} · {new Date(c.claimedAt).toLocaleDateString("zh-CN",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={()=>approve(c.id,"reject")} disabled={busy2} className="flex-1 glass-card-pink rounded-xl py-2.5 text-red-400 text-sm font-semibold active:scale-95 disabled:opacity-50">✗ 拒绝</button>
                      <button onClick={()=>approve(c.id,"approve")} disabled={busy2} className="flex-1 glass-card-green rounded-xl py-2.5 text-green-400 text-sm font-bold active:scale-95 glow-green disabled:opacity-50">{busy2?"处理中...":"✓ 批准"}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ── 设置 ── */}
        {tab === "settings" && (
          <div className="space-y-4">
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <h3 className="text-white font-bold flex items-center gap-2"><span>⚙️</span> 孩子信息</h3>
              <div>
                <label className="text-xs text-slate-500 block mb-1">孩子名字</label>
                <input value={nameInput} onChange={(e)=>setNameInput(e.target.value)} placeholder="输入名字" className={inputCls}/>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">年级</label>
                <div className="flex gap-2 flex-wrap">
                  {GRADES.map((g) => (
                    <button key={g} type="button" onClick={()=>setGradeInput(String(g))}
                      className={`w-12 h-10 rounded-xl text-sm font-bold transition-all ${String(g)===gradeInput?"btn-complete text-white":"glass-card text-slate-400"}`}>
                      {g}年
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={saveSettings} disabled={busy}
                className="w-full btn-complete rounded-xl py-3 text-white font-bold disabled:opacity-60">
                {busy ? "保存中..." : "保存设置"}
              </button>
            </div>
            <div className="glass-card rounded-2xl p-4 text-xs text-slate-500 space-y-1 leading-relaxed">
              <p className="text-slate-400 font-semibold mb-2">💡 使用说明</p>
              <p>• <span className="text-purple-300">固定任务</span>：设置后每天自动生成，无需重复添加</p>
              <p>• <span className="text-cyan-300">今日任务</span>：临时添加，仅今天有效</p>
              <p>• 孩子完成任务获得 ⚡星能 和 💎星钻</p>
              <p>• 星钻可在商店兑换家长设置的奖励</p>
              <p>• 兑换申请需在「审批」标签中确认</p>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-semibold z-50 ${
          toast.ok!==false?"glass-card-green glow-green text-green-300":"glass-card-pink text-red-300"
        }`}>{toast.msg}</div>
      )}
    </div>
  );
}

// ── 复用的任务/模板表单组件 ─────────────────────────────────
function TaskForm({ form, setForm, onSubmit, onCancel, busy, inputCls, title, hint }: {
  form: typeof blankTask; setForm: (f: typeof blankTask) => void;
  onSubmit: (e: React.FormEvent) => void; onCancel: () => void;
  busy: boolean; inputCls: string; title: string; hint: string;
}) {
  const SUBJECTS = ["语文","数学","英语","科学"];
  const TYPES    = ["打卡","练习","背诵"];
  const DIFFS    = ["普通","选做","挑战"];
  return (
    <form onSubmit={onSubmit} className="glass-card rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-purple-300 font-semibold text-sm">✦ {title}</h3>
        <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{hint}</span>
      </div>
      <div>
        <label className="text-xs text-slate-500 block mb-1">任务名称 *</label>
        <input value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} placeholder="例：背诵第3单元单词" required className={inputCls}/>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 block mb-1">学科</label>
          <select value={form.subject} onChange={(e)=>setForm({...form,subject:e.target.value})} className={inputCls}>
            {SUBJECTS.map(s=><option key={s} style={{background:"#1e1e3a"}}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">类型</label>
          <select value={form.type} onChange={(e)=>setForm({...form,type:e.target.value})} className={inputCls}>
            {TYPES.map(t=><option key={t} style={{background:"#1e1e3a"}}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 block mb-1">难度</label>
          <select value={form.difficulty} onChange={(e)=>setForm({...form,difficulty:e.target.value})} className={inputCls}>
            {DIFFS.map(d=><option key={d} style={{background:"#1e1e3a"}}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">预计时长(分)</label>
          <input type="number" value={form.estimatedMinutes} min="5" max="120" onChange={(e)=>setForm({...form,estimatedMinutes:e.target.value})} className={inputCls}/>
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-500 block mb-1">备注（可选）</label>
        <input value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} placeholder="例：完成课本第45页" className={inputCls}/>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 glass-card rounded-xl py-2.5 text-sm text-slate-400">取消</button>
        <button type="submit" disabled={busy} className="flex-1 btn-complete rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-60">{busy?"添加中...":"确认添加"}</button>
      </div>
    </form>
  );
}
