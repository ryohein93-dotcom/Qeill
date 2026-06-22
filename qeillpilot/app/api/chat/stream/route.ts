import { createClient } from "@/lib/supabase/server";
import { generatePlan, selectBestProduct } from "@/lib/ai/openai";
import { searchProducts } from "@/lib/products";
import type { ChatTurn, CountryCode, LocaleCode, SelectedProduct } from "@/lib/types";
import { v4 as uuid } from "uuid";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function enc(obj: unknown) {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

const COUNTRY_LABEL: Record<CountryCode, string> = {
  JP: "日本",
  US: "アメリカ",
  GB: "イギリス"
};

export async function POST(request: Request) {
  const { history, totalBudget, country, locale } = (await request.json()) as {
    history: ChatTurn[];
    totalBudget: number | null;
    country: CountryCode;
    locale: LocaleCode;
  };

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(new TextEncoder().encode(enc(obj)));

      try {
        send({ type: "status", message: "AIがあなたの要望を分析しています..." });

        const plan = await generatePlan(
          history,
          totalBudget,
          COUNTRY_LABEL[country ?? "JP"]
        );

        if (plan.needsClarification || plan.categories.length === 0) {
          send({
            type: "clarification",
            question: plan.clarifyingQuestion || "もう少し詳しく教えていただけますか？"
          });
          controller.close();
          return;
        }

        // 予算配分プランをまず送信（グラフ表示用）
        send({ type: "plan", intentSummary: plan.intentSummary, categories: plan.categories });

        const userIntent = history
          .filter((h) => h.role === "user")
          .map((h) => h.content)
          .join("\n");

        const items: SelectedProduct[] = [];

        // カテゴリごとに順番に検索→選定→カード送信
        for (let i = 0; i < plan.categories.length; i++) {
          const cat = plan.categories[i];
          if (i > 0) await sleep(800);

          send({ type: "status", message: `「${cat.category}」を検索しています...` });

          const candidates = await searchProducts(cat.searchKeywords, country ?? "JP");
          if (candidates.length === 0) continue;

          send({ type: "status", message: `「${cat.category}」の最適な商品を選定しています...` });

          const { selectedProductId, reason } = await selectBestProduct(
            cat.category,
            userIntent,
            candidates,
            locale ?? "ja"
          );

          const chosen =
            candidates.find((c) => c.id === selectedProductId) ?? candidates[0];

          const alternatives = candidates
            .filter((c) => c.id !== chosen.id && c.shop !== chosen.shop)
            .slice(0, 1)
            .map((c) => ({ shop: c.shop, shopName: c.shopName, price: c.price, url: c.url }));

          const item: SelectedProduct = {
            category: cat.category,
            product: chosen,
            alternativePrices: alternatives.length ? alternatives : undefined,
            reason,
            allocatedBudget: cat.allocatedBudget
          };

          items.push(item);
          // カードを1枚ずつリアルタイムで送信
          send({ type: "item", item });
        }

        const totalPrice = items.reduce((s, it) => s + it.product.price, 0);
        const budget =
          totalBudget ??
          plan.categories.reduce((s, c) => s + c.allocatedBudget, 0);

        const proposal = {
          id: uuid(),
          title: plan.intentSummary,
          summary: plan.intentSummary,
          totalBudget: budget,
          totalPrice,
          difference: budget - totalPrice,
          country: country ?? "JP",
          items,
          createdAt: new Date().toISOString()
        };

        send({ type: "done", proposal });

        // ログイン済みなら履歴保存
        try {
          const supabase = createClient();
          const {
            data: { user }
          } = await supabase.auth.getUser();
          if (user) {
            await supabase.from("history").insert({
              user_id: user.id,
              title: proposal.title,
              country: proposal.country,
              proposal
            });
          }
        } catch {
          /* 履歴保存失敗は無視 */
        }
      } catch {
        send({ type: "error", message: "エラーが発生しました。もう一度お試しください。" });
      }

      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    }
  });
}
