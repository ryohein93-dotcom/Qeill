"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import type { ChatTurn, CountryCode, ProposalResult, SelectedProduct } from "@/lib/types";
import { StreamItemCard } from "@/components/StreamItemCard";
import { BudgetPieChart } from "@/components/BudgetPieChart";
import { SummaryCard } from "@/components/SummaryCard";

// ─── 型定義 ───────────────────────────────────────────────────────────────────

type Message =
  | { id: string; role: "user"; content: string }
  | { id: string; role: "assistant"; kind: "status"; content: string }
  | { id: string; role: "assistant"; kind: "plan"; intentSummary: string; categories: { category: string; allocatedBudget: number }[] }
  | { id: string; role: "assistant"; kind: "item"; item: SelectedProduct }
  | { id: string; role: "assistant"; kind: "summary"; proposal: ProposalResult }
  | { id: string; role: "assistant"; kind: "clarification"; content: string }
  | { id: string; role: "assistant"; kind: "error"; content: string };

type HistoryEntry = { id: string; title: string };

const POPULAR = ["ゲーミングPC", "動画編集を始めたい", "一人暮らしの新生活", "キャンプ用品", "テニスを始めたい", "カメラ一式"];

const COUNTRY_OPTIONS: { code: CountryCode; label: string }[] = [
  { code: "JP", label: "🇯🇵 JP" },
  { code: "US", label: "🇺🇸 US" },
  { code: "GB", label: "🇬🇧 GB" }
];

function genId() {
  return Math.random().toString(36).slice(2);
}

function extractBudget(text: string): number | null {
  const man = text.replace(/,/g, "").match(/(\d+)\s*万円/);
  if (man) return Number(man[1]) * 10000;
  const yen = text.replace(/,/g, "").match(/(\d{4,})\s*円/);
  if (yen) return Number(yen[1]);
  return null;
}

// ─── メインコンポーネント ─────────────────────────────────────────────────────

export function ChatPageClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>([]);
  const [budget, setBudget] = useState<number | null>(null);
  const [country, setCountry] = useState<CountryCode>("JP");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // テキストエリアの高さを自動調整
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [input]);

  const addMsg = useCallback((msg: Omit<Message, "id">) => {
    setMessages((prev) => [...prev, { ...msg, id: genId() } as Message]);
  }, []);

  const updateLastStatus = useCallback((content: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant" && (last as any).kind === "status") {
        return [...prev.slice(0, -1), { ...last, content } as Message];
      }
      return [...prev, { id: genId(), role: "assistant", kind: "status", content } as Message];
    });
  }, []);

  async function handleSubmit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");

    const detectedBudget = budget ?? extractBudget(trimmed);
    if (detectedBudget) setBudget(detectedBudget);

    addMsg({ role: "user", content: trimmed } as any);
    const nextHistory: ChatTurn[] = [...chatHistory, { role: "user", content: trimmed }];
    setChatHistory(nextHistory);
    setLoading(true);

    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: nextHistory,
          totalBudget: detectedBudget,
          country,
          locale: "ja"
        })
      });

      if (!res.body) throw new Error("no body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            handleStreamEvent(data, nextHistory);
          } catch { /* JSON parse失敗は無視 */ }
        }
      }
    } catch {
      addMsg({ role: "assistant", kind: "error", content: "エラーが発生しました。もう一度お試しください。" } as any);
    }

    setLoading(false);
  }

  function handleStreamEvent(data: any, nextHistory: ChatTurn[]) {
    switch (data.type) {
      case "status":
        updateLastStatus(data.message);
        break;
      case "plan":
        // statusを削除してplanに差し替え
        setMessages((prev) => {
          const filtered = prev.filter((m) => !((m as any).kind === "status"));
          return [...filtered, {
            id: genId(),
            role: "assistant",
            kind: "plan",
            intentSummary: data.intentSummary,
            categories: data.categories
          } as Message];
        });
        break;
      case "item":
        addMsg({ role: "assistant", kind: "item", item: data.item } as any);
        break;
      case "clarification":
        setMessages((prev) => prev.filter((m) => !((m as any).kind === "status")));
        addMsg({ role: "assistant", kind: "clarification", content: data.question } as any);
        setChatHistory([...nextHistory, { role: "assistant", content: data.question }]);
        break;
      case "done":
        addMsg({ role: "assistant", kind: "summary", proposal: data.proposal } as any);
        setHistory((prev) => [{ id: data.proposal.id, title: data.proposal.title }, ...prev].slice(0, 20));
        setChatHistory([...nextHistory, { role: "assistant", content: data.proposal.summary }]);
        break;
      case "error":
        setMessages((prev) => prev.filter((m) => !((m as any).kind === "status")));
        addMsg({ role: "assistant", kind: "error", content: data.message } as any);
        break;
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(input);
    }
  }

  const isFirstMessage = messages.length === 0;

  return (
    <div className="flex h-screen bg-paper overflow-hidden">
      {/* ─── サイドバー ─── */}
      <aside
        className={`flex flex-col border-r border-line bg-white transition-all duration-200 ${
          sidebarOpen ? "w-64" : "w-0 overflow-hidden"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-line shrink-0">
          <span className="font-display text-base font-bold text-ink">
            Qeill<span className="text-brand">Pilot</span>
          </span>
          <button
            onClick={() => setMessages([])}
            className="text-xs text-muted hover:text-brand px-2 py-1 rounded border border-line hover:border-brand transition"
          >
            + 新規
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {history.length === 0 ? (
            <p className="px-4 py-6 text-xs text-muted text-center">履歴はまだありません</p>
          ) : (
            <ul>
              {history.map((h) => (
                <li key={h.id}>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-ink/80 hover:bg-brand-soft hover:text-brand transition truncate">
                    {h.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-line px-4 py-3 shrink-0">
          <div className="flex gap-1">
            {COUNTRY_OPTIONS.map((opt) => (
              <button
                key={opt.code}
                onClick={() => setCountry(opt.code)}
                className={`flex-1 rounded py-1 text-xs font-medium transition ${
                  country === opt.code
                    ? "bg-brand text-white"
                    : "text-muted hover:text-brand"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ─── メインエリア ─── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* ヘッダー */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-line bg-white shrink-0">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-1.5 rounded hover:bg-line transition text-muted"
            aria-label="サイドバーを開閉"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect y="3" width="18" height="1.5" rx="0.75" fill="currentColor" />
              <rect y="8.25" width="18" height="1.5" rx="0.75" fill="currentColor" />
              <rect y="13.5" width="18" height="1.5" rx="0.75" fill="currentColor" />
            </svg>
          </button>
          {!sidebarOpen && (
            <span className="font-display text-sm font-bold text-ink">
              Qeill<span className="text-brand">Pilot</span>
            </span>
          )}
        </header>

        {/* チャットエリア */}
        <div className="flex-1 overflow-y-auto">
          {isFirstMessage ? (
            // ウェルカム画面
            <div className="flex flex-col items-center justify-center h-full px-4 gap-8">
              <div className="text-center">
                <h1 className="font-display text-3xl font-bold text-ink">
                  何をしたいですか？
                </h1>
                <p className="mt-2 text-sm text-muted">目的と予算を伝えるだけ。AIが最適な買い物構成を提案します。</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                {POPULAR.map((p) => (
                  <button
                    key={p}
                    onClick={() => handleSubmit(p)}
                    className="rounded-full border border-line bg-white px-4 py-2 text-sm text-ink/80 hover:border-brand hover:text-brand transition"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* 入力欄（画面下部固定） */}
        <div className="shrink-0 border-t border-line bg-white px-4 py-3">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3 rounded-card border border-line bg-paper px-4 py-3 focus-within:border-brand transition">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="今日は何を買いたいですか？（Enterで送信、Shift+Enterで改行）"
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-ink outline-none placeholder:text-muted"
                disabled={loading}
              />
              <button
                onClick={() => handleSubmit(input)}
                disabled={loading || !input.trim()}
                className="shrink-0 rounded-full bg-brand p-2.5 text-white transition hover:bg-brand-deep disabled:opacity-40"
                aria-label="送信"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M14 8L2 2l2.5 6L2 14l12-6z" fill="currentColor" />
                </svg>
              </button>
            </div>
            <p className="mt-1.5 text-center text-xs text-muted">
              QeillPilotはAmazon・楽天市場から情報を取得して提案します
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── メッセージバブル ─────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-brand px-4 py-3 text-sm text-white">
          {msg.content}
        </div>
      </div>
    );
  }

  // AIメッセージ
  return (
    <div className="flex gap-3 items-start">
      {/* AIアイコン */}
      <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-brand to-accent flex items-center justify-center text-white text-xs font-bold font-display mt-0.5">
        Q
      </div>

      <div className="flex-1 min-w-0">
        {msg.kind === "status" && (
          <div className="flex items-center gap-2 text-sm text-muted py-1">
            <span className="inline-flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce [animation-delay:300ms]" />
            </span>
            {msg.content}
          </div>
        )}

        {msg.kind === "plan" && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-ink">{msg.intentSummary}</p>
            <BudgetPieChart categories={msg.categories} />
          </div>
        )}

        {msg.kind === "item" && (
          <StreamItemCard item={msg.item} />
        )}

        {msg.kind === "summary" && (
          <SummaryCard proposal={msg.proposal} />
        )}

        {(msg.kind === "clarification" || msg.kind === "error") && (
          <div className={`rounded-2xl rounded-tl-sm px-4 py-3 text-sm ${
            msg.kind === "error" ? "bg-red-50 text-red-600" : "bg-line text-ink"
          }`}>
            {msg.content}
          </div>
        )}
      </div>
    </div>
  );
}
