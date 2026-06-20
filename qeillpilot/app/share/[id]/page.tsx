import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProposalCard } from "@/components/ProposalCard";
import type { ProposalResult } from "@/lib/types";

export default async function SharePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shared_compositions")
    .select("title, proposal")
    .eq("id", params.id)
    .single();

  if (error || !data) notFound();

  const proposal = data.proposal as ProposalResult;

  return (
    <main className="min-h-screen px-4 py-16">
      <h1 className="mb-8 text-center font-display text-xl font-bold text-ink">{data.title}</h1>
      <ProposalCard proposal={proposal} />
    </main>
  );
}
