import { createServerSupabase } from "@/lib/supabase";
import { Welcome } from "@/components/dashboard/Welcome";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { DashboardAgentGrid } from "@/components/dashboard/DashboardAgentGrid";
import config from "../../../tellet.json";

export default async function DashboardPage() {
  const supabase = await createServerSupabase();

  const [
    { data: agents },
    { count: conversationCount },
    { count: messageCount },
    { data: activity },
    { data: costData },
  ] = await Promise.all([
    supabase.from("agents").select("*").order("created_at"),
    supabase.from("conversations").select("*", { count: "exact", head: true }),
    supabase.from("messages").select("*", { count: "exact", head: true }),
    supabase
      .from("activity_log")
      .select("*, agents(name, role)")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("activity_log").select("cost_usd"),
  ]);

  const activeAgents = (agents || []).filter((a) => a.status === "active").length;
  const totalCost = (costData || []).reduce(
    (sum, r) => sum + Number(r.cost_usd || 0),
    0
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {config.company.name}
        </h1>
        <p className="text-text-secondary text-sm mt-1">Your AI team is ready.</p>
      </div>

      <Welcome
        agentCount={agents?.length || 0}
        conversationCount={conversationCount || 0}
      />

      <StatsCards
        totalConversations={conversationCount || 0}
        totalMessages={messageCount || 0}
        activeAgents={activeAgents}
        estimatedCost={totalCost}
      />

      <div>
        <h2 className="text-lg font-semibold mb-4">Your Agents</h2>
        <DashboardAgentGrid
          agents={(agents || []).map((a) => ({
            id: a.id,
            name: a.name,
            role: a.role,
            status: a.status,
          }))}
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        {activity && activity.length > 0 ? (
          <div className="space-y-2">
            {activity.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 rounded-lg border border-border bg-bg-secondary/30 px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">
                      {(a.agents as { name: string })?.name}
                    </span>{" "}
                    <span className="text-text-secondary">
                      {a.summary || a.action}
                    </span>
                  </p>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {new Date(a.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-bg-secondary/20 p-8 text-center">
            <p className="text-text-secondary text-sm">
              No activity yet. Chat with your agents to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
