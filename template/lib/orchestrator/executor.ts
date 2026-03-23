import { createServerSupabase } from "@/lib/supabase";
import fs from "fs";
import path from "path";

export async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  const supabase = await createServerSupabase();

  switch (name) {
    case "list_agents": {
      const { data } = await supabase
        .from("agents")
        .select("id, name, role, status, model")
        .order("created_at");
      return JSON.stringify(data || []);
    }

    case "get_stats": {
      const [
        { count: conversations },
        { count: messages },
        { data: agents },
        { data: costData },
      ] = await Promise.all([
        supabase.from("conversations").select("*", { count: "exact", head: true }),
        supabase.from("messages").select("*", { count: "exact", head: true }),
        supabase.from("agents").select("id, status"),
        supabase.from("activity_log").select("cost_usd"),
      ]);
      const activeAgents = (agents || []).filter((a) => a.status === "active").length;
      const totalCost = (costData || []).reduce(
        (sum, r) => sum + Number(r.cost_usd || 0),
        0
      );
      return JSON.stringify({
        conversations: conversations || 0,
        messages: messages || 0,
        activeAgents,
        totalAgents: agents?.length || 0,
        estimatedCost: `$${totalCost.toFixed(2)}`,
      });
    }

    case "update_agent_prompt": {
      const { agent_id, system_prompt } = input as {
        agent_id: string;
        system_prompt: string;
      };
      const { error } = await supabase
        .from("agents")
        .update({ system_prompt })
        .eq("id", agent_id);
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, agent_id });
    }

    case "update_site_content": {
      const configPath = path.join(process.cwd(), "tellet.json");
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

      const updates = input as Record<string, unknown>;
      if (updates.tagline) config.site.tagline = updates.tagline;
      if (updates.subtitle) config.site.subtitle = updates.subtitle;
      if (updates.cta) config.site.cta = updates.cta;
      if (updates.features) config.site.features = updates.features;
      if (updates.faq) config.site.faq = updates.faq;

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      return JSON.stringify({
        success: true,
        message: "Site content updated. Rebuild to see changes.",
      });
    }

    case "get_recent_conversations": {
      const limit = (input.limit as number) || 10;
      const { data } = await supabase
        .from("conversations")
        .select("id, channel, created_at, agents(name, role), messages(count)")
        .order("created_at", { ascending: false })
        .limit(limit);
      return JSON.stringify(data || []);
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}
