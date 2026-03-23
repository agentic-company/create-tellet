import Anthropic from "@anthropic-ai/sdk";
import { orchestratorTools } from "@/lib/orchestrator/tools";
import { executeTool } from "@/lib/orchestrator/executor";
import { getConfig } from "@/lib/tellet";

const client = new Anthropic();

function buildSystemPrompt(): string {
  const config = getConfig();
  return `You are the Orchestrator for "${config.company.name}", an AI-powered ${config.company.industry} company.

Your role is to help the Owner manage and operate their company through conversation. You can:
- View and manage AI agents (list, update prompts)
- Check company statistics (conversations, messages, costs)
- Update the website content (tagline, features, FAQ)
- View recent conversations

Company: ${config.company.name}
Industry: ${config.company.industry}
Description: ${config.company.description}
Agents: ${config.agents.map((a) => `${a.name} (${a.role})`).join(", ")}

Guidelines:
- Be helpful and proactive. Suggest improvements when you see opportunities.
- When updating content, explain what you changed and why.
- For potentially impactful changes, confirm with the owner before executing.
- Keep responses concise and actionable.
- Speak in the language the owner uses.`;
}

export async function POST(request: Request) {
  const { messages } = await request.json();

  if (!messages || !Array.isArray(messages)) {
    return Response.json({ error: "messages array required" }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        let currentMessages: Anthropic.MessageParam[] = messages.map(
          (m: { role: string; content: string }) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })
        );

        // Agentic loop — keep running until no more tool calls
        while (true) {
          const response = await client.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 4096,
            system: buildSystemPrompt(),
            tools: orchestratorTools,
            messages: currentMessages,
          });

          // Collect text and tool use blocks
          let hasToolUse = false;
          const toolResults: Anthropic.ToolResultBlockParam[] = [];

          for (const block of response.content) {
            if (block.type === "text" && block.text) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: block.text })}\n\n`)
              );
            }

            if (block.type === "tool_use") {
              hasToolUse = true;

              // Notify client which tool is running
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ tool: block.name, status: "running" })}\n\n`
                )
              );

              const result = await executeTool(
                block.name,
                block.input as Record<string, unknown>
              );

              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: result,
              });

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ tool: block.name, status: "done" })}\n\n`
                )
              );
            }
          }

          if (!hasToolUse) {
            // No more tool calls — we're done
            break;
          }

          // Add assistant response + tool results, continue loop
          currentMessages = [
            ...currentMessages,
            { role: "assistant" as const, content: response.content },
            { role: "user" as const, content: toolResults },
          ];
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
        );
        controller.close();
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: err instanceof Error ? err.message : "Orchestrator error" })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
