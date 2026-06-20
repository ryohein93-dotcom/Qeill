"use client";

import { useState } from "react";

const POPULAR_PROMPTS_JA = [
  "ゲーミングPC",
  "動画編集を始めたい",
  "一人暮らしの新生活",
  "キャンプ用品",
  "テニスを始めたい",
  "カメラ一式",
  "プレゼントを選びたい"
];

export function ChatInput({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [value, setValue] = useState("");

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        className="flex items-center gap-2 rounded-card border border-line bg-white px-5 py-4 shadow-card"
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="今日は何を買いたいですか？"
          className="flex-1 bg-transparent text-base outline-none placeholder:text-muted focus-ring rounded"
          aria-label="やりたいことや予算を入力"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-brand px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-deep focus-ring"
        >
          相談する
        </button>
      </form>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {POPULAR_PROMPTS_JA.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => submit(prompt)}
            className="rounded-full border border-line bg-white px-4 py-1.5 text-sm text-ink/80 transition hover:border-brand hover:text-brand focus-ring"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
