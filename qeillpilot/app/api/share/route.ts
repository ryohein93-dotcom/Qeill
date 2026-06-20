import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 共有はログイン不要。匿名でも共有用レコードを作成できる。
export async function POST(request: Request) {
  const supabase = createClient();
  const body = await request.json();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("shared_compositions")
    .insert({
      owner_id: user?.id ?? null,
      title: body.title,
      proposal: body.proposal
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
