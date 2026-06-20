import Link from "next/link";
import { ChatExperience } from "@/components/ChatExperience";

export default function HomePage() {
  return (
    <main className="min-h-screen px-4 py-10 sm:py-16">
      <header className="mx-auto mb-12 flex max-w-4xl items-center justify-between">
        <span className="font-display text-lg font-bold tracking-tight text-ink">
          Qeill<span className="text-brand">Pilot</span>
        </span>
        <nav className="flex items-center gap-4 text-sm text-muted">
          <Link href="/history" className="transition hover:text-brand">
            履歴
          </Link>
          <Link href="/favorites" className="transition hover:text-brand">
            お気に入り
          </Link>
        </nav>
      </header>

      <section className="mx-auto mb-12 max-w-2xl text-center">
        <h1 className="font-display text-3xl font-bold leading-snug text-ink sm:text-4xl">
          何をしたいか、いくらまでか。
          <br />
          それだけで、AIが買い物を組み立てる。
        </h1>
        <p className="mt-3 text-sm text-muted sm:text-base">
          「商品を探す」のではなく、「目的を伝える」だけ。AmazonとRakutenから最適な構成を提案します。
        </p>
      </section>

      <ChatExperience />
    </main>
  );
}
