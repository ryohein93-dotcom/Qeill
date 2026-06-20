import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function FavoritesPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: favorites } = await supabase
    .from("favorites")
    .select("id, title, total_price, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-16">
      <Link href="/" className="text-sm text-muted hover:text-brand">
        ← トップへ戻る
      </Link>
      <h1 className="mt-4 mb-8 font-display text-2xl font-bold text-ink">お気に入り</h1>

      {!favorites?.length && <p className="text-sm text-muted">まだ保存された構成がありません。</p>}

      <ul className="divide-y divide-line rounded-card border border-line bg-white">
        {favorites?.map((fav) => (
          <li key={fav.id} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-ink">{fav.title}</p>
              <p className="text-xs text-muted">{new Date(fav.created_at).toLocaleDateString("ja-JP")}</p>
            </div>
            <span className="font-tabular text-sm font-bold text-ink">¥{fav.total_price.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
