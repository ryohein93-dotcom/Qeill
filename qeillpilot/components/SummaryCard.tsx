"use client";

import { useState } from "react";
import type { ProposalResult } from "@/lib/types";

const CURRENCY_SYMBOL: Record<string, string> = { JPY: "¥", USD: "$", GBP: "£" };

export function SummaryCard({ proposal }: { proposal: ProposalResult }) {
  const [saved, setSaved] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const currency = proposal.items[0]?.product.currency ?? "JPY";
  const sym = CURRENCY_SYMBOL[currency] ?? "";

  const maxPrice = Math.max(...proposal.items.map((it) => it.product.price));

  async function handleSave() {
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: proposal.title, totalPrice: proposal.totalPrice, proposal })
    });
    if (res.ok) setSaved(true);
  }

  async function handleShare() {
    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: proposal.title, proposal })
    });
    if (res.ok) {
      const data = await res.json();
      const url = `${window.location.origin}/share/${data.id}`;
      setShareUrl(url);
      navigator.clipboard?.writeText(url).catch(() => {});
    }
  }

  return (
    <div className="rounded-card border border-line bg-white shadow-card overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-brand to-accent px-5 py-4">
        <p className="text-xs text-white/70 font-display uppercase tracking-widest">Proposal Complete</p>
        <p className="mt-1 text-white font-display font-bold text-base">{proposal.title}</p>
      </div>

      {/* 価格バーチャート */}
      <div className="px-5 py-4 border-b border-line">
        <p className="text-xs text-muted mb-3">カテゴリ別価格</p>
        <div className="space-y-2.5">
          {proposal.items.map((item, i) => {
            const pct = (item.product.price / maxPrice) * 100;
            return (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-ink truncate max-w-[60%]">{item.category}</span>
                  <span className="font-tabular font-medium text-ink">{sym}{item.product.price.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-line overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand to-accent"
                    style={{ width: `${pct}%`, transition: "width 0.6s ease" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 合計 */}
      <div className="px-5 py-4 space-y-1.5 border-b border-line">
        <div className="flex justify-between text-sm text-muted">
          <span>予算</span>
          <span className="font-tabular">{sym}{proposal.totalBudget.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-ink">
          <span>合計</span>
          <span className="font-tabular">{sym}{proposal.totalPrice.toLocaleString()}</span>
        </div>
        <div className={`flex justify-between text-sm font-medium ${proposal.difference >= 0 ? "text-mint" : "text-red-500"}`}>
          <span>{proposal.difference >= 0 ? "予算内に収まりました" : "予算をオーバーしています"}</span>
          <span className="font-tabular">
            {proposal.difference >= 0 ? "-" : "+"}{sym}{Math.abs(proposal.difference).toLocaleString()}
          </span>
        </div>
      </div>

      {/* アクション */}
      <div className="flex gap-2 px-5 py-3">
        <button
          onClick={handleSave}
          className="flex-1 rounded-full border border-line py-2 text-xs font-medium text-ink hover:border-brand hover:text-brand transition"
        >
          {saved ? "✓ 保存済み" : "お気に入りに保存"}
        </button>
        <button
          onClick={handleShare}
          className="flex-1 rounded-full border border-line py-2 text-xs font-medium text-ink hover:border-brand hover:text-brand transition"
        >
          共有する
        </button>
      </div>

      {shareUrl && (
        <p className="px-5 pb-3 text-xs text-center text-muted">
          リンクをコピーしました 🔗
        </p>
      )}
    </div>
  );
}
