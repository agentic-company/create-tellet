import { createServerSupabase } from "@/lib/supabase";
import { streamAgentWithTools } from "@/lib/engine";
import { searchKnowledge } from "@/lib/mcp/knowledge";
import type Anthropic from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  const { message, agent_id, conversation_id } = await request.json();

  if (!message || !agent_id) {
    return Response.json({ error: "message and agent_id required" }, { status: 400 });
  }

  const supabase = await createServerSupabase();

  // Get agent
  const { data: agent } = await supabase
    .from("agents")
    .select("*")
    .eq("id", agent_id)
    .single();

  if (!agent) return Response.json({ error: "Agent not found" }, { status: 404 });

  // Get or create conversation
  let convId = conversation_id;
  if (!convId) {
    const { data: conv } = await supabase
      .from("conversations")
      .insert({ agent_id, channel: "web_chat" })
      .select("id")
      .single();
    convId = conv?.id;
  }

  // Save user message
  await supabase.from("messages").insert({
    conversation_id: convId,
    role: "user",
    content: message,
  });

  // Get history
  const { data: history } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", convId)
    .order("created_at")
    .limit(20);

  const messages = (history || []).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Built-in tools
  const builtinTools = [
    {
      name: "search_knowledge",
      description: "Search the company knowledge base for product info, policies, and FAQ",
      input_schema: {
        type: "object" as const,
        properties: {
          query: { type: "string", description: "Search query" },
        },
        required: ["query"],
      },
      execute: async (input: Record<string, unknown>) => {
        return searchKnowledge(input.query as string);
      },
    },
  ];

  // Stream with tool use
  const stream = await streamAgentWithTools({
    agent: {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      model: agent.model,
      provider: agent.config?.provider as string | undefined,
      systemPrompt: agent.system_prompt,
      channels: ["web_chat"],
      tools: agent.config?.tools || [],
    },
    messages,
    builtinTools,
  });

  let fullResponse = "";
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const reader = stream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullResponse += value.text;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: value.text })}\n\n`));
        }

        // Save response
        await supabase.from("messages").insert({
          conversation_id: convId,
          role: "assistant",
          content: fullResponse,
        });

        // Log activity
        await supabase.from("activity_log").insert({
          agent_id,
          action: "replied",
          summary: `Replied: "${fullResponse.slice(0, 80)}${fullResponse.length > 80 ? "..." : ""}"`,
        });

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, conversation_id: convId })}\n\n`));
        controller.close();
      } catch {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
