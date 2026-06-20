import OpenAI from "openai";
import type { AiPlan, ChatTurn, ProductCandidate } from "@/lib/types";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// .env の AI_MODEL で切り替え可能。仕様書記載の GPT-5.5 mini を既定値とする。
const MODEL = process.env.AI_MODEL || "gpt-5.5-mini";

const PLAN_SYSTEM_PROMPT = `あなたはAIショッピングアシスタント「QeillPilot」です。
ユーザーの「やりたいこと」や「予算」から、必要な商品カテゴリと各カテゴリへの予算配分を判断してください。

ルール:
- 必要のないカテゴリは含めない
- 予算が不明な場合や、用途を判断するのに重要な情報が欠けている場合のみ、1つだけ質問する（質問は最小限に）
- 質問する場合は categories は空配列にする
- 予算は categories の allocatedBudget の合計が、ユーザーが提示した総予算を超えないようにする
- searchKeywords には各ECサイトで検索するための具体的なキーワードを入れる
- 出力は必ず以下のJSON形式のみ。説明文やMarkdownのコードフェンスは含めない。

{
  "needsClarification": boolean,
  "clarifyingQuestion": string | null,
  "intentSummary": string,
  "categories": [
    { "category": string, "searchKeywords": string, "allocatedBudget": number }
  ]
}`;

export async function generatePlan(
  history: ChatTurn[],
  totalBudget: number | null,
  countryLabel: string
): Promise<AiPlan> {
  const budgetLine = totalBudget
    ? `総予算: ${totalBudget}`
    : "総予算: 未指定（ユーザーの発言から読み取れない場合は質問してよい）";

  const response = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: PLAN_SYSTEM_PROMPT },
      { role: "system", content: `対応国: ${countryLabel}\n${budgetLine}` },
      ...history.map((turn) => ({
        role: turn.role,
        content: turn.content
      }))
    ]
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  return JSON.parse(raw) as AiPlan;
}

const REASON_SYSTEM_PROMPT = `あなたはAIショッピングアシスタント「QeillPilot」です。
与えられた商品候補の中から、用途・価格・レビュー評価・レビュー件数・コストパフォーマンスを総合的に評価して
最も適した1点を選び、専門知識がない人にも分かりやすい一文〜二文の選定理由を日本語（または指定言語）で書いてください。
単純な最安値選びはしないでください。

出力は以下のJSON形式のみ:
{ "selectedProductId": string, "reason": string }`;

export async function selectBestProduct(
  category: string,
  intent: string,
  candidates: ProductCandidate[],
  locale: "ja" | "en"
): Promise<{ selectedProductId: string; reason: string }> {
  const response = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: REASON_SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          locale,
          category,
          userIntent: intent,
          candidates: candidates.map((c) => ({
            id: c.id,
            title: c.title,
            price: c.price,
            rating: c.rating,
            reviewCount: c.reviewCount,
            brand: c.brand
          }))
        })
      }
    ]
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  return JSON.parse(raw) as { selectedProductId: string; reason: string };
}
