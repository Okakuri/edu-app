"use client";
import { useState } from "react";

interface Poem {
  id: string; title: string; author: string; dynasty: string;
  content: string; grade: number; tags: string;
}
interface MathProblem {
  id: string; question: string; answer: string; options: string[] | null;
  type: string; topic: string; difficulty: string;
}

const TABS = [
  { label: "古诗词", icon: "📜", color: "text-amber-400" },
  { label: "数学",   icon: "🔢", color: "text-indigo-400" },
  { label: "英语",   icon: "🌍", color: "text-green-400" },
];

export default function PracticeClient({ poems, mathProblems }: { poems: Poem[]; mathProblems: MathProblem[] }) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="flex flex-col min-h-screen text-slate-100">
      <div className="px-4 pt-12 pb-0">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-2xl float">✨</span>
          <h1 className="text-white text-xl font-bold">知识星球</h1>
        </div>
        <div className="flex gap-2 mb-0">
          {TABS.map((tab, i) => (
            <button key={tab.label} onClick={() => setActiveTab(i)}
              className={`flex-1 flex flex-col items-center py-3 rounded-t-2xl transition-all font-medium text-sm gap-1 ${
                activeTab === i ? "glass-card-purple text-purple-300" : "text-slate-500"
              }`}>
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-4 overflow-y-auto">
        {activeTab === 0 && <PoemTab poems={poems} />}
        {activeTab === 1 && <MathTab problems={mathProblems} />}
        {activeTab === 2 && <EnglishTab />}
      </div>
    </div>
  );
}

// ── 古诗词 Tab ─────────────────────────────────────────────
type PoemMode = "browse" | "quiz";

function PoemTab({ poems }: { poems: Poem[] }) {
  const [mode, setMode] = useState<PoemMode>("browse");
  const [grade, setGrade] = useState<number | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const grades = Array.from(new Set(poems.map((p) => p.grade))).sort();
  const filtered = grade ? poems.filter((p) => p.grade === grade) : poems;

  if (mode === "quiz") {
    return <PoemQuiz poems={filtered} onBack={() => setMode("browse")} />;
  }

  return (
    <div>
      {/* 模式切换 */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setMode("browse")}
          className="flex-1 glass-card-purple rounded-xl py-2.5 text-purple-300 text-sm font-semibold flex items-center justify-center gap-2">
          <span>📖</span> 浏览学习
        </button>
        <button onClick={() => setMode("quiz")}
          className="flex-1 btn-complete rounded-xl py-2.5 text-white text-sm font-semibold flex items-center justify-center gap-2">
          <span>✏️</span> 填空测试
        </button>
      </div>

      {/* 年级筛选 */}
      <div className="flex gap-2 flex-wrap mb-4">
        {[null, ...grades].map((g) => (
          <button key={g ?? "all"} onClick={() => setGrade(g)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              grade === g ? "bg-amber-500/80 text-white glow-gold" : "glass-card text-slate-400"
            }`}>
            {g === null ? "全部" : `${g}年级`}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-500 mb-3">📜 共{filtered.length}首 · 点击展开全诗</p>
      <div className="space-y-2">
        {filtered.map((poem) => {
          const open = openId === poem.id;
          return (
            <button key={poem.id} onClick={() => setOpenId(open ? null : poem.id)}
              className="w-full text-left glass-card rounded-2xl p-4 transition-all active:scale-[0.98]"
              style={open ? { borderColor: "rgba(245,158,11,0.4)", boxShadow: "0 0 20px rgba(245,158,11,0.15)" } : {}}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] badge-chinese px-2 py-0.5 rounded-full">{poem.grade}年级</span>
                    <span className="text-xs text-slate-500">{poem.dynasty} · {poem.author}</span>
                  </div>
                  <h3 className="font-bold text-slate-200">{poem.title}</h3>
                </div>
                <span className="text-slate-500 text-sm mt-1">{open ? "▲" : "▼"}</span>
              </div>
              {open && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-slate-300 text-sm leading-8 whitespace-pre-wrap">
                    {poem.content.replace(/([，。！？、；：])/g, "$1\n").trim()}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {poem.tags.split(",").map((t) => (
                      <span key={t} className="text-xs glass-card text-slate-400 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── 古诗填空 Quiz ──────────────────────────────────────────
function PoemQuiz({ poems, onBack }: { poems: Poem[]; onBack: () => void }) {
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const [done, setDone] = useState(false);
  const [reward, setReward] = useState<{ xp: number; points: number } | null>(null);

  // 从诗句里挖空一段
  const questions = poems.slice(0, 8).map((poem) => {
    const lines = poem.content.split(/[，。！？]/).filter(Boolean);
    const qi = Math.floor(Math.random() * lines.length);
    const answer = lines[qi].trim();
    const display = lines.map((l, i) =>
      i === qi ? "　".repeat(Math.max(2, answer.length)) : l
    ).join("，") + "。";
    return { poem, display, answer };
  });

  if (done) {
    return (
      <div className="text-center py-12">
        <p className="text-5xl mb-4 bounce-in">📜</p>
        <p className="text-white font-bold text-xl mb-1">古诗测试完成！</p>
        <div className="glass-card-gold rounded-2xl p-5 my-5 inline-block min-w-[160px]">
          <p className="text-gradient-gold font-black text-4xl">{score.right}/{score.total}</p>
          <p className="text-amber-400 text-sm mt-1">填对题数</p>
        </div>
        {reward && (
          <div className="glass-card-purple rounded-xl p-3 mb-5 mx-8">
            <p className="text-purple-300 text-sm">⚡ +{reward.xp} 星能 &nbsp;💎 +{reward.points} 星钻</p>
          </div>
        )}
        <button onClick={onBack}
          className="btn-complete px-8 py-3 rounded-full text-white font-semibold">
          返回 →
        </button>
      </div>
    );
  }

  const q = questions[idx];

  const handleCheck = () => {
    if (!input.trim()) return;
    const isCorrect = input.trim() === q.answer ||
      q.answer.includes(input.trim()) ||
      input.trim().includes(q.answer);
    setCorrect(isCorrect);
    setChecked(true);
    setScore((s) => ({ right: s.right + (isCorrect ? 1 : 0), total: s.total + 1 }));
  };

  const handleNext = async () => {
    setInput("");
    setChecked(false);
    if (idx >= questions.length - 1) {
      // 完成，请求奖励
      try {
        const res = await fetch("/api/practice/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "poem", score: score.right + (correct ? 1 : 0), total: questions.length }),
        });
        if (res.ok) {
          const data = await res.json();
          setReward({ xp: data.xpGained, points: data.pointsGained });
        }
      } catch (_) {}
      setDone(true);
    } else {
      setIdx((i) => i + 1);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onBack} className="glass-card rounded-full w-8 h-8 flex items-center justify-center text-slate-400">←</button>
        <span className="text-slate-400 text-xs">{idx + 1} / {questions.length}</span>
        <span className="text-green-400 text-xs font-semibold ml-auto">✓ {score.right} 正确</span>
      </div>

      <div className="h-1.5 glass-card rounded-full mb-5 overflow-hidden">
        <div className="h-full rounded-full transition-all"
          style={{ width: `${(idx / questions.length) * 100}%`, background: "linear-gradient(90deg,#f59e0b,#a855f7)" }} />
      </div>

      <div className="glass-card-gold rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="badge-chinese text-[11px] px-2 py-0.5 rounded-full">{q.poem.grade}年级</span>
          <span className="text-xs text-slate-500">{q.poem.dynasty} · {q.poem.author}</span>
        </div>
        <p className="text-amber-400 font-bold text-lg mb-2">{q.poem.title}</p>
        <p className="text-slate-300 text-sm leading-8">
          {q.display.split(/[，。]/).filter(Boolean).map((seg, i, arr) => (
            <span key={i}>{seg}{i < arr.length - 1 ? (i % 2 === 1 ? "。\n" : "，") : "。"}</span>
          ))}
        </p>
        <p className="text-slate-500 text-xs mt-2">↑ 请填写画线处的诗句</p>
      </div>

      {!checked ? (
        <div className="space-y-3">
          <input
            type="text" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCheck()}
            placeholder="在此输入缺失的诗句..."
            className="w-full glass-card rounded-xl px-4 py-3.5 text-slate-200 text-sm focus:outline-none focus:border-amber-500 placeholder-slate-600"
            autoFocus
          />
          <button onClick={handleCheck}
            className="w-full btn-complete py-3.5 rounded-xl text-white font-bold">
            提交答案
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className={`rounded-xl p-4 ${correct ? "glass-card-green" : "glass-card-pink"}`}>
            <p className="font-bold text-sm mb-1">{correct ? "✓ 正确！" : "✗ 答错了"}</p>
            {!correct && (
              <p className="text-slate-300 text-sm">正确答案：<span className="text-amber-400 font-semibold">{q.answer}</span></p>
            )}
          </div>
          <button onClick={handleNext}
            className="w-full btn-complete py-3.5 rounded-xl text-white font-bold">
            {idx < questions.length - 1 ? "下一题 →" : "查看结果 🎉"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── 数学 Tab ─────────────────────────────────────────────
function MathTab({ problems }: { problems: MathProblem[] }) {
  const [topic, setTopic] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [done, setDone] = useState(false);
  const [reward, setReward] = useState<{ xp: number; points: number; perfect: boolean } | null>(null);

  const topics = Array.from(new Set(problems.map((p) => p.topic)));
  const filtered = topic ? problems.filter((p) => p.topic === topic) : problems;

  const resetQuiz = () => { setIdx(0); setSelected(null); setScore({ correct: 0, total: 0 }); setDone(false); setReward(null); };

  if (done) {
    const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    return (
      <div className="text-center py-10">
        <p className="text-5xl mb-3 bounce-in">{pct === 100 ? "🏆" : pct >= 60 ? "⭐" : "💪"}</p>
        <p className="text-white font-bold text-xl mb-1">
          {pct === 100 ? "全对！完美！" : pct >= 80 ? "很厉害！" : pct >= 60 ? "继续加油！" : "再练练吧！"}
        </p>
        <p className="text-slate-400 text-sm mb-4">正确率 {pct}%</p>
        <div className="glass-card-purple rounded-2xl p-5 mb-4 inline-block min-w-[160px]">
          <p className="text-gradient-purple font-black text-4xl">{score.correct}<span className="text-slate-400 font-normal text-xl">/{score.total}</span></p>
          <p className="text-purple-300 text-sm mt-1">答对题数</p>
        </div>
        {reward && (
          <div className="glass-card rounded-xl p-3 mb-5 mx-4">
            <p className="text-purple-300 text-sm">⚡ +{reward.xp} 星能 &nbsp;💎 +{reward.points} 星钻</p>
            {reward.perfect && <p className="text-yellow-400 text-xs mt-1 sparkle">🌟 满分加成 ×1.5！</p>}
          </div>
        )}
        <div className="flex gap-3 mx-4">
          <button onClick={resetQuiz} className="flex-1 btn-complete py-3 rounded-xl text-white font-semibold">再来一次 🚀</button>
        </div>
      </div>
    );
  }

  if (idx >= filtered.length && filtered.length > 0) {
    // 异步请求奖励
    if (!done) {
      fetch("/api/practice/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "math", score: score.correct, total: score.total }),
      }).then(r => r.json()).then(data => {
        setReward({ xp: data.xpGained, points: data.pointsGained, perfect: data.perfect });
        setDone(true);
      }).catch(() => setDone(true));
    }
    return <div className="text-center py-10 text-slate-400">计算中...</div>;
  }

  const p = filtered[idx];
  if (!p) return (
    <div className="text-center py-10 text-slate-400">
      <p className="text-4xl mb-3">🔢</p>
      <p>暂无该主题题目</p>
    </div>
  );

  const pick = (opt: string) => {
    if (selected) return;
    setSelected(opt);
    setScore((s) => ({ correct: s.correct + (opt === p.answer ? 1 : 0), total: s.total + 1 }));
  };

  return (
    <div>
      {/* 主题筛选 */}
      <div className="flex gap-2 flex-wrap mb-4">
        {[null, ...topics].map((t) => (
          <button key={t ?? "all"} onClick={() => { setTopic(t); resetQuiz(); }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              topic === t ? "bg-indigo-500/80 text-white" : "glass-card text-slate-400"
            }`}>
            {t ?? "全部"}
          </button>
        ))}
      </div>

      <div className="flex justify-between text-xs text-slate-400 mb-2">
        <span>{idx + 1} / {filtered.length}</span>
        <span className="text-green-400 font-semibold">✓ {score.correct} 正确</span>
      </div>
      <div className="h-1.5 glass-card rounded-full mb-4 overflow-hidden">
        <div className="h-full rounded-full transition-all"
          style={{ width: `${(idx / filtered.length) * 100}%`, background: "linear-gradient(90deg,#6366f1,#06b6d4)" }} />
      </div>

      <div className="glass-card rounded-2xl p-5 mb-4"
        style={{ borderColor: "rgba(99,102,241,0.3)" }}>
        <div className="flex gap-2 mb-3 flex-wrap">
          <span className="badge-math text-[11px] px-2 py-0.5 rounded-full">{p.topic}</span>
          <span className="badge-normal text-[11px] px-2 py-0.5 rounded-full">{p.type}</span>
          {p.difficulty === "挑战" && <span className="badge-hard text-[11px] px-2 py-0.5 rounded-full">挑战 🔥</span>}
        </div>
        <p className="text-slate-200 font-semibold leading-relaxed text-[15px]">{p.question}</p>
      </div>

      {p.options && (
        <div className="space-y-2 mb-4">
          {p.options.map((opt) => {
            const isSel = selected === opt;
            const isRight = opt === p.answer;
            let style = "glass-card text-slate-300";
            if (selected) {
              if (isRight) style = "glass-card-green glow-green text-green-300";
              else if (isSel) style = "glass-card-pink text-red-300";
            }
            return (
              <button key={opt} onClick={() => pick(opt)}
                className={`w-full text-left px-4 py-4 rounded-xl font-medium text-sm transition-all active:scale-[0.98] ${style}`}>
                <span className="flex items-center justify-between">
                  {opt}
                  {selected && isRight && <span className="text-green-400 font-bold">✓</span>}
                  {selected && isSel && !isRight && <span className="text-red-400 font-bold">✗</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <button onClick={() => { setSelected(null); setIdx((i) => i + 1); }}
          className="w-full btn-complete text-white rounded-xl py-4 font-bold text-base">
          {idx < filtered.length - 1 ? "下一题 →" : "查看结果 🎉"}
        </button>
      )}
    </div>
  );
}

// ── 英语 Tab ────────────────────────────────────────────
const WORD_GROUPS = [
  {
    group: "形容词",
    words: [
      { word: "beautiful",  meaning: "美丽的",  emoji: "🌸" },
      { word: "important",  meaning: "重要的",  emoji: "⭐" },
      { word: "different",  meaning: "不同的",  emoji: "🎭" },
      { word: "favourite",  meaning: "最喜欢的",emoji: "❤️" },
      { word: "dangerous",  meaning: "危险的",  emoji: "⚠️" },
      { word: "excellent",  meaning: "优秀的",  emoji: "🏆" },
      { word: "necessary",  meaning: "必要的",  emoji: "🔑" },
      { word: "wonderful",  meaning: "精彩的",  emoji: "✨" },
    ],
  },
  {
    group: "动词",
    words: [
      { word: "celebrate",  meaning: "庆祝",    emoji: "🎉" },
      { word: "discover",   meaning: "发现",    emoji: "🔭" },
      { word: "remember",   meaning: "记住",    emoji: "💭" },
      { word: "introduce",  meaning: "介绍",    emoji: "👋" },
      { word: "practise",   meaning: "练习",    emoji: "📚" },
      { word: "understand", meaning: "理解",    emoji: "💡" },
    ],
  },
  {
    group: "名词",
    words: [
      { word: "environment", meaning: "环境",   emoji: "🌿" },
      { word: "temperature",  meaning: "温度",   emoji: "🌡️" },
      { word: "population",  meaning: "人口",   emoji: "👥" },
      { word: "competition", meaning: "竞赛",   emoji: "🥇" },
      { word: "suggestion",  meaning: "建议",   emoji: "💬" },
      { word: "opportunity", meaning: "机会",   emoji: "🚪" },
    ],
  },
];

function EnglishTab() {
  const [groupIdx, setGroupIdx] = useState(0);
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [done, setDone] = useState<Set<number>>(new Set());

  const group = WORD_GROUPS[groupIdx];
  const doneCount = done.size;

  return (
    <div>
      {/* 组切换 */}
      <div className="flex gap-2 mb-4">
        {WORD_GROUPS.map((g, i) => (
          <button key={g.group} onClick={() => { setGroupIdx(i); setFlipped(new Set()); setDone(new Set()); }}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
              groupIdx === i ? "glass-card-green text-green-300" : "glass-card text-slate-500"
            }`}>
            {g.group}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-slate-500">点击翻转 · 打✓标记已记住</p>
        <p className="text-xs text-green-400 font-semibold">已记住 {doneCount}/{group.words.length}</p>
      </div>

      {doneCount === group.words.length && doneCount > 0 && (
        <div className="glass-card-green rounded-xl p-3 mb-4 text-center">
          <p className="text-green-400 font-bold text-sm">🎉 本组单词全部记住了！</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {group.words.map((w, i) => {
          const isFlipped = flipped.has(i);
          const isDone = done.has(i);
          return (
            <div key={w.word}
              onClick={() => setFlipped((prev) => { const n = new Set(prev); isFlipped ? n.delete(i) : n.add(i); return n; })}
              className={`glass-card rounded-2xl p-4 text-center cursor-pointer active:scale-[0.96] relative transition-all ${
                isDone ? "glass-card-green opacity-80" : ""
              }`}>
              <p className="text-2xl mb-2">{w.emoji}</p>
              <p className="font-bold text-slate-200 text-sm">{w.word}</p>
              <div className={`mt-1.5 transition-all duration-200 overflow-hidden ${isFlipped ? "max-h-10 opacity-100" : "max-h-0 opacity-0"}`}>
                <p className="text-green-400 font-semibold text-sm">{w.meaning}</p>
              </div>
              {!isFlipped && <p className="text-slate-600 text-xs mt-1">点击查看</p>}

              {isFlipped && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDone((prev) => { const n = new Set(prev); isDone ? n.delete(i) : n.add(i); return n; });
                  }}
                  className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
                    isDone ? "bg-green-500 text-white" : "glass-card text-slate-400"
                  }`}
                >✓</button>
              )}
            </div>
          );
        })}
      </div>

      {/* 进度条 */}
      <div className="mt-4 glass-card rounded-xl p-3">
        <div className="flex justify-between text-xs text-slate-500 mb-2">
          <span>{group.group}词组</span>
          <span>{doneCount}/{group.words.length}</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(doneCount / group.words.length) * 100}%`, background: "linear-gradient(90deg,#10b981,#06b6d4)" }} />
        </div>
      </div>
    </div>
  );
}
