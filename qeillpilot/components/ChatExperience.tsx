"use client";

import { useState } from "react";
import { ChatInput } from "@/components/ChatInput";
import { ProposalCard } from "@/components/ProposalCard";
import type { ChatTurn, CountryCode, LocaleCode, ProposalResult } from "@/lib/types";

const COUNTRY_OPTIONS: { code: CountryCode; label: string }[] = [
  { code: "JP", label: "🇯🇵 日本" },
  { code: "US", label: "🇺🇸 アメリカ" },
  { code: "GB", label: "🇬🇧 イギリス" }
];

function extractBudget(text: string): number | null {
  const match = text.replace(/,/g, "").match(/(\d+)\s*万円/);
  if (match) return Number(match[1]) * 10000;
  const plain = text.replace(/,/g, "").match(/(\d{4,})\s*円/);
  if (plain) return Number(plain[1]);
  return null;
}

export function ChatExperience() {
  const [country, setCountry] = useState<CountryCode>("JP");
  const [locale] = useState<LocaleCode>("ja");
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [budget, setBudget] = useState<number | null>(null);
  const [proposal, setProposal] = useState<ProposalResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(text: string) {
    setError(null);
    setProposal(null);

    const detectedBudget = budget ?? extractBudget(text);
    if (detectedBudget) setBudget(detectedBudget);

    const nextHistory: ChatTurn[] = [...history, { role: "user", content: text }];
    setHistory(nextHistory);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: nextHistory, totalBudget: detectedBudget, country, locale })
      });

      if (!res.ok) throw new Error("提案の生成に失敗しました");
      const data = await res.json();

      if (data.status === "needs_clarification") {
        setHistory([...nextHistory, { role: "assistant", content: data.question }]);
      } else {
        setHistory([...nextHistory, { role: "assistant", content: data.proposal.summary }]);
        setProposal(data.proposal);
      }
    } catch (err) {
      setError("提案の生成中にエラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex gap-2">
        {COUNTRY_OPTIONS.map((opt) => (
          <button
            key={opt.code}
            onClick={() => setCountry(opt.code)}
            className={`rounded-full border px-3 py-1 text-xs transition focus-ring ${
              country === opt.code
                ? "border-brand bg-brand-soft text-brand"
                : "border-line text-muted hover:border-brand/40"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <ChatInput onSubmit={handleSubmit} />

      <div className="w-full max-w-2xl space-y-3">
        {history
          .filter((turn) => turn.role === "assistant" && !proposal)
          .slice(-1)
          .map((turn, i) => (
            <p key={i} className="text-center text-sm text-ink/80">
              {turn.content}
            </p>
          ))}

        {loading && (
          <p className="text-center text-sm text-muted">AIが商品構成を考えています…</p>
        )}

        {error && <p className="text-center text-sm text-red-500">{error}</p>}
      </div>

      {proposal && <ProposalCard proposal={proposal} />}
    </div>
  );
}
