import { createServerSupabase } from "@/lib/supabase";
import { AgentsListClient } from "@/components/dashboard/AgentsListClient";

export default async function AgentsPage() {
  const supabase = await createServerSupabase();
  const { data: agents } = await supabase.from("agents").select("*").order("created_at");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
      <AgentsListClient agents={agents || []} />
    </div>
  );
}
