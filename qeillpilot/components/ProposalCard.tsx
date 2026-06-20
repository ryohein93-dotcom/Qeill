"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProposalResult } from "@/lib/types";
import { BudgetBar } from "@/components/BudgetBar";

const CURRENCY_SYMBOL: Record<string, string> = { JPY: "¥", USD: "$", GBP: "£" };

function formatPrice(price: number, currency: string) {
  const symbol = CURRENCY_SYMBOL[currency] ?? "";
  return `${symbol}${price.toLocaleString()}`;
}

export function ProposalCard({ proposal }: { proposal: ProposalResult }) {
  const [saved, setSaved] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const currency = proposal.items[0]?.product.currency ?? "JPY";

  async function handleSave() {
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: proposal.title,
        totalPrice: proposal.totalPrice,
        proposal
      })
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
      if (navigator.share) {
        navigator.share({ title: proposal.title, url }).catch(() => {});
      } else {
        navigator.clipboard?.writeText(url);
      }
    }
  }

  return (
    <div className="receipt-edge mx-auto w-full max-w-2xl rounded-card border border-line bg-white shadow-card">
      <div className="px-7 pb-5 pt-7">
        <p className="font-display text-xs uppercase tracking-[0.2em] text-muted">Qeill Proposal</p>
        <h2 className="mt-1 font-display text-xl font-bold text-ink">{proposal.title}</h2>

        <div className="mt-5">
          <BudgetBar items={proposal.items} currency={currency} />
        </div>
      </div>

      <div className="tear-line mx-7" />

      <ul className="divide-y divide-line px-7">
        {proposal.items.map((item) => (
          <li key={item.category} className="py-5">
            <div className="flex gap-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-line bg-brand-soft">
                {item.product.imageUrl ? (
                  <Image
                    src={item.product.imageUrl}
                    alt={item.product.title}
                    fill
                    sizes="80px"
                    className="object-contain"
                    unoptimized
                  />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-accent">{item.category}</p>
                <p className="mt-0.5 truncate text-sm font-medium text-ink">{item.product.title}</p>

                <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                  <span>{item.product.shopName}</span>
                  {item.product.rating !== null && (
                    <span>
                      ★ {item.product.rating.toFixed(1)} ({item.product.reviewCount ?? 0})
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm text-ink/80">{item.reason}</p>

                {item.alternativePrices?.map((alt) => (
                  <p key={alt.shop} className="mt-1 text-xs text-muted">
                    {alt.shopName}: {formatPrice(alt.price, currency)}
                  </p>
                ))}
              </div>

              <div className="flex shrink-0 flex-col items-end justify-between">
                <span className="font-tabular text-sm font-bold text-ink">
                  {formatPrice(item.product.price, currency)}
                </span>
                <a
                  href={item.product.url}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="rounded-full bg-brand px-4 py-1.5 text-xs font-medium text-white transition hover:bg-brand-deep focus-ring"
                >
                  購入する
                </a>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="tear-line mx-7" />

      <div className="space-y-1.5 px-7 py-5">
        <div className="flex justify-between text-sm text-muted">
          <span>予算</span>
          <span className="font-tabular">{formatPrice(proposal.totalBudget, currency)}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-ink">
          <span>合計</span>
          <span className="font-tabular">{formatPrice(proposal.totalPrice, currency)}</span>
        </div>
        <div className={`flex justify-between text-sm ${proposal.difference >= 0 ? "text-mint" : "text-red-500"}`}>
          <span>予算との差額</span>
          <span className="font-tabular">{formatPrice(proposal.difference, currency)}</span>
        </div>
      </div>

      <div className="flex gap-2 px-7 pb-7">
        <button
          onClick={handleSave}
          className="flex-1 rounded-full border border-line py-2.5 text-sm font-medium text-ink transition hover:border-brand hover:text-brand focus-ring"
        >
          {saved ? "保存しました" : "お気に入りに保存"}
        </button>
        <button
          onClick={handleShare}
          className="flex-1 rounded-full border border-line py-2.5 text-sm font-medium text-ink transition hover:border-brand hover:text-brand focus-ring"
        >
          共有する
        </button>
      </div>

      {shareUrl && (
        <p className="px-7 pb-5 text-center text-xs text-muted">
          共有リンクをコピーしました: <span className="text-brand">{shareUrl}</span>
        </p>
      )}
    </div>
  );
}
