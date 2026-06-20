import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HistoryPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: history } = await supabase
    .from("history")
    .select("id, title, country, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-16">
      <Link href="/" className="text-sm text-muted hover:text-brand">
        ← トップへ戻る
      </Link>
      <h1 className="mt-4 mb-8 font-display text-2xl font-bold text-ink">相談履歴</h1>

      {!history?.length && <p className="text-sm text-muted">まだ相談履歴がありません。</p>}

      <ul className="divide-y divide-line rounded-card border border-line bg-white">
        {history?.map((h) => (
          <li key={h.id} className="flex items-center justify-between px-5 py-4">
            <p className="text-sm font-medium text-ink">{h.title}</p>
            <p className="text-xs text-muted">{new Date(h.created_at).toLocaleDateString("ja-JP")}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
