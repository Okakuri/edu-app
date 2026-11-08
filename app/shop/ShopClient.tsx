"use client";

import { useState } from "react";

interface Reward {
  id: string;
  title: string;
  description: string | null;
  emoji: string;
  cost: number;
  stock: number;
}

interface Claim {
  id: string;
  status: string;
  claimedAt: string;
  resolvedAt: string | null;
  reward: Reward;
}

interface Props {
  points: number;
  rewards: Reward[];
  claims: Claim[];
}

type Tab = "shop" | "history";

export default function ShopClient({ points: initPoints, rewards: initRewards, claims: initClaims }: Props) {
  const [tab, setTab] = useState<Tab>("shop");
  const [points, setPoints] = useState(initPoints);
  const [claims, setClaims] = useState(initClaims);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [confirmReward, setConfirmReward] = useState<Reward | null>(null);

  const pendingCount = claims.filter((c) => c.status === "pending").length;

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleClaim = async (reward: Reward) => {
    if (points < reward.cost) {
      showToast(`还差 ${reward.cost - points} 颗星钻 💎`, false);
      return;
    }
    setConfirmReward(reward);
  };

  const confirmClaim = async () => {
    if (!confirmReward) return;
    setClaimingId(confirmReward.id);
    setConfirmReward(null);
    try {
      const res = await fetch("/api/rewards/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId: confirmReward.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setPoints((p) => p - data.cost);
        // 刷新兑换记录
        const claimsRes = await fetch("/api/rewards/claims");
        if (claimsRes.ok) {
          const newClaims = await claimsRes.json();
          setClaims(newClaims);
        }
        showToast("🎉 申请已提交！等待家长审批");
        setTab("history");
      } else {
        showToast(data.error || "兑换失败", false);
      }
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-slate-100">
      {/* Header */}
      <div className="relative px-4 pt-12 pb-4 overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #f59e0b, transparent)" }} />

        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl float">🏪</span>
          <h1 className="text-white text-xl font-bold">星钻商店</h1>
        </div>

        {/* 星钻余额 */}
        <div className="glass-card-gold glow-gold rounded-2xl p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl float-slow"
            style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", boxShadow: "0 0 20px rgba(245,158,11,0.5)" }}>
            💎
          </div>
          <div>
            <p className="text-slate-400 text-xs">我的星钻</p>
            <p className="text-gradient-gold font-black text-3xl leading-none">{points}</p>
            <p className="text-amber-400 text-xs mt-0.5">完成任务和练习可赚取更多</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="glass-card rounded-xl p-1 flex gap-1">
          {(["shop", "history"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                tab === t ? "btn-complete text-white" : "text-slate-400"
              }`}>
              {t === "shop" ? (
                <><span>🎁</span> 奖励商店</>
              ) : (
                <><span>📋</span> 兑换记录
                  {pendingCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-yellow-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {pendingCount}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-6 flex-1">
        {tab === "shop" && (
          <ShopTab
            rewards={initRewards}
            points={points}
            claimingId={claimingId}
            onClaim={handleClaim}
            claims={claims}
          />
        )}
        {tab === "history" && (
          <HistoryTab claims={claims} />
        )}
      </div>

      {/* 确认弹窗 */}
      {confirmReward && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-6"
          onClick={() => setConfirmReward(null)}>
          <div className="glass-card-purple glow-purple rounded-3xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-5">
              <p className="text-5xl mb-3 float">{confirmReward.emoji}</p>
              <h3 className="text-white font-bold text-lg">{confirmReward.title}</h3>
              {confirmReward.description && (
                <p className="text-slate-400 text-sm mt-1">{confirmReward.description}</p>
              )}
            </div>
            <div className="glass-card rounded-xl p-3 flex items-center justify-between mb-5">
              <span className="text-slate-400 text-sm">消耗星钻</span>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl">💎</span>
                <span className="text-cyan-300 font-black text-xl">{confirmReward.cost}</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs text-center mb-4">
              提交后需要家长审批才能生效
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmReward(null)}
                className="flex-1 glass-card rounded-xl py-3 text-slate-400 font-semibold">
                取消
              </button>
              <button onClick={confirmClaim}
                className="flex-1 btn-complete rounded-xl py-3 text-white font-bold">
                确认兑换 ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-semibold z-50 ${
          toast.ok ? "glass-card-green glow-green text-green-300" : "glass-card-pink text-red-300"
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ── 商店 Tab ─────────────────────────────────────────────────
function ShopTab({ rewards, points, claimingId, onClaim, claims }: {
  rewards: Reward[];
  points: number;
  claimingId: string | null;
  onClaim: (r: Reward) => void;
  claims: Claim[];
}) {
  if (rewards.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4 float">🎁</p>
        <p className="text-slate-300 font-semibold">商店还没有奖励</p>
        <p className="text-slate-500 text-sm mt-1">请家长去"家长中心"添加奖励</p>
      </div>
    );
  }

  const canAfford = (cost: number) => points >= cost;

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 mb-2">用积累的星钻兑换现实奖励 ✨</p>
      {rewards.map((reward) => {
        const affordable = canAfford(reward.cost);
        const hasPending = claims.some((c) => c.reward.id === reward.id && c.status === "pending");
        const isLoading = claimingId === reward.id;

        return (
          <div key={reward.id}
            className={`glass-card rounded-2xl p-4 transition-all ${
              affordable ? "border-opacity-100" : "opacity-60"
            }`}
            style={affordable ? { borderColor: "rgba(245,158,11,0.3)" } : {}}>
            <div className="flex items-center gap-4">
              {/* Emoji */}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${
                affordable ? "glass-card-gold" : "glass-card"
              }`}>
                {reward.emoji}
              </div>

              {/* 信息 */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-100 text-sm leading-tight">{reward.title}</p>
                {reward.description && (
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{reward.description}</p>
                )}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-base">💎</span>
                  <span className={`font-black text-lg leading-none ${affordable ? "text-cyan-300" : "text-slate-500"}`}>
                    {reward.cost}
                  </span>
                  <span className="text-xs text-slate-500">星钻</span>
                  {!affordable && (
                    <span className="text-xs text-red-400 ml-1">
                      差{reward.cost - points}颗
                    </span>
                  )}
                </div>
              </div>

              {/* 按钮 */}
              <button
                onClick={() => onClaim(reward)}
                disabled={!affordable || isLoading || hasPending}
                className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  hasPending
                    ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 cursor-default"
                    : affordable
                    ? "btn-complete text-white active:scale-95"
                    : "glass-card text-slate-600 cursor-not-allowed"
                }`}
              >
                {isLoading ? "⏳" : hasPending ? "审批中" : "兑换"}
              </button>
            </div>

            {/* 进度条：还差多少 */}
            {!affordable && (
              <div className="mt-3">
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full"
                    style={{
                      width: `${Math.min((points / reward.cost) * 100, 100)}%`,
                      background: "linear-gradient(90deg,#f59e0b,#a855f7)",
                    }} />
                </div>
                <p className="text-[10px] text-slate-600 mt-1 text-right">
                  {points}/{reward.cost}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── 兑换记录 Tab ─────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; cls: string; icon: string }> = {
  pending:  { label: "待审批", cls: "glass-card-gold text-yellow-400",   icon: "⏳" },
  approved: { label: "已通过", cls: "glass-card-green text-green-400",   icon: "✓" },
  rejected: { label: "已拒绝", cls: "glass-card-pink text-red-400",      icon: "✗" },
};

function HistoryTab({ claims }: { claims: Claim[] }) {
  if (claims.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">📋</p>
        <p className="text-slate-400 text-sm">还没有兑换记录</p>
      </div>
    );
  }

  const pending  = claims.filter((c) => c.status === "pending");
  const resolved = claims.filter((c) => c.status !== "pending");

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div>
          <p className="text-xs text-yellow-400 font-semibold mb-2 flex items-center gap-1">
            <span>⏳</span> 待家长审批（{pending.length}）
          </p>
          <div className="space-y-2">
            {pending.map((c) => <ClaimCard key={c.id} claim={c} />)}
          </div>
        </div>
      )}
      {resolved.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 font-semibold mb-2">历史记录</p>
          <div className="space-y-2">
            {resolved.map((c) => <ClaimCard key={c.id} claim={c} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function ClaimCard({ claim }: { claim: Claim }) {
  const s = STATUS_MAP[claim.status] ?? STATUS_MAP.pending;
  return (
    <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-3">
      <span className="text-2xl">{claim.reward.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">{claim.reward.title}</p>
        <p className="text-xs text-slate-500">
          {new Date(claim.claimedAt).toLocaleDateString("zh-CN", {
            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
          })}
          &nbsp;· 💎{claim.reward.cost}星钻
        </p>
      </div>
      <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold shrink-0 ${s.cls}`}>
        {s.icon} {s.label}
      </span>
    </div>
  );
}
