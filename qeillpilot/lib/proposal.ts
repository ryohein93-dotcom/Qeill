import { v4 as uuid } from "uuid";
import type { AiPlan, ChatTurn, CountryCode, LocaleCode, ProposalResult, SelectedProduct } from "@/lib/types";
import { generatePlan, selectBestProduct } from "@/lib/ai/openai";
import { searchProducts } from "@/lib/products";

const COUNTRY_LABEL: Record<CountryCode, string> = {
  JP: "日本",
  US: "アメリカ",
  GB: "イギリス"
};

export interface BuildProposalInput {
  history: ChatTurn[];
  totalBudget: number | null;
  country: CountryCode;
  locale: LocaleCode;
}

export type BuildProposalOutput =
  | { status: "needs_clarification"; question: string }
  | { status: "proposal"; proposal: ProposalResult };

// チャット履歴 → カテゴリ判断 → 商品検索 → 最適商品選定 → 提案結果の組み立て、までを一気通貫で行う
export async function buildProposal(input: BuildProposalInput): Promise<BuildProposalOutput> {
  const plan: AiPlan = await generatePlan(input.history, input.totalBudget, COUNTRY_LABEL[input.country]);

  if (plan.needsClarification || plan.categories.length === 0) {
    return {
      status: "needs_clarification",
      question: plan.clarifyingQuestion || "もう少し詳しく教えていただけますか？"
    };
  }

  const userIntent = input.history.filter((h) => h.role === "user").map((h) => h.content).join("\n");

  const items: SelectedProduct[] = await Promise.all(
    plan.categories.map(async (cat): Promise<SelectedProduct | null> => {
      const candidates = await searchProducts(cat.searchKeywords, input.country);
      if (candidates.length === 0) return null;

      const { selectedProductId, reason } = await selectBestProduct(
        cat.category,
        userIntent,
        candidates,
        input.locale
      );

      const chosen = candidates.find((c) => c.id === selectedProductId) ?? candidates[0];

      // 同一カテゴリ内で他ショップの価格があれば比較情報として添える（日本のみ複数ショップ）
      const alternatives = candidates
        .filter((c) => c.id !== chosen.id && c.shop !== chosen.shop)
        .slice(0, 1)
        .map((c) => ({ shop: c.shop, shopName: c.shopName, price: c.price, url: c.url }));

      return {
        category: cat.category,
        product: chosen,
        alternativePrices: alternatives.length ? alternatives : undefined,
        reason,
        allocatedBudget: cat.allocatedBudget
      };
    })
  ).then((results) => results.filter((r): r is SelectedProduct => r !== null));

  const totalPrice = items.reduce((sum, item) => sum + item.product.price, 0);
  const totalBudget = input.totalBudget ?? plan.categories.reduce((s, c) => s + c.allocatedBudget, 0);

  const proposal: ProposalResult = {
    id: uuid(),
    title: plan.intentSummary,
    summary: plan.intentSummary,
    totalBudget,
    totalPrice,
    difference: totalBudget - totalPrice,
    country: input.country,
    items,
    createdAt: new Date().toISOString()
  };

  return { status: "proposal", proposal };
}
