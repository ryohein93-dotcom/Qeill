import { NextResponse } from "next/server";
import { buildProposal } from "@/lib/proposal";
import { createClient } from "@/lib/supabase/server";
import type { ChatTurn, CountryCode, LocaleCode } from "@/lib/types";

interface ChatRequestBody {
  history: ChatTurn[];
  totalBudget: number | null;
  country: CountryCode;
  locale: LocaleCode;
}

export async function POST(request: Request) {
  const body = (await request.json()) as ChatRequestBody;

  if (!body.history?.length) {
    return NextResponse.json({ error: "history is required" }, { status: 400 });
  }

  const result = await buildProposal({
    history: body.history,
    totalBudget: body.totalBudget ?? null,
    country: body.country ?? "JP",
    locale: body.locale ?? "ja"
  });

  // ログインユーザーであれば相談履歴を保存
  if (result.status === "proposal") {
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("history").insert({
        user_id: user.id,
        title: result.proposal.title,
        country: result.proposal.country,
        proposal: result.proposal
      });
    }
  }

  return NextResponse.json(result);
}
