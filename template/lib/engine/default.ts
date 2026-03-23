import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { getToolsForAgent, callMCPTool } from "@/lib/mcp/client";
import { getConfig } from "@/lib/tellet";
import type { AgentConfig } from "./index";
import type { StreamChunk } from "@/lib/providers";

interface BuiltinTool {
  name: string;
  description: string;
  input_schema: Anthropic.Tool.InputSchema;
  execute: (input: Record<string, unknown>) => Promise<string>;
}

export interface AgentStreamOptions {
  agent: AgentConfig;
  messages: { role: "user" | "assistant"; content: string }[];
  builtinTools?: BuiltinTool[];
  onToolStart?: (toolName: string) => void;
  onToolEnd?: (toolName: string) => void;
}

export async function streamAgentWithTools(
  options: AgentStreamOptions
): Promise<ReadableStream<StreamChunk>> {
  const { agent, messages, builtinTools = [], onToolStart, onToolEnd } = options;
  const config = getConfig();
  const provider = agent.provider || config.llm.provider;

  // Collect tools: builtin + MCP
  const mcpTools = await getToolsForAgent(agent.id);
  const allTools: Anthropic.Tool[] = [
    ...builtinTools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.input_schema,
    })),
    ...mcpTools,
  ];

  if (provider === "openai") {
    return streamOpenAI(agent, messages, allTools, builtinTools);
  }
  return streamAnthropic(agent, messages, allTools, builtinTools, onToolStart, onToolEnd);
}

async function streamAnthropic(
  agent: AgentConfig,
  messages: { role: "user" | "assistant"; content: string }[],
  tools: Anthropic.Tool[],
  builtinTools: BuiltinTool[],
  onToolStart?: (name: string) => void,
  onToolEnd?: (name: string) => void
): Promise<ReadableStream<StreamChunk>> {
  let _client: Anthropic | null = null;
  function getClient() {
    if (!_client) _client = new Anthropic();
    return _client;
  }

  return new ReadableStream({
    async start(controller) {
      try {
        let currentMessages: Anthropic.MessageParam[] = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // Agentic loop
        while (true) {
          const hasTools = tools.length > 0;
          const response = await getClient().messages.create({
            model: agent.model,
            max_tokens: 2048,
            system: agent.systemPrompt,
            messages: currentMessages,
            ...(hasTools ? { tools } : {}),
          });

          let hasToolUse = false;
          const toolResults: Anthropic.ToolResultBlockParam[] = [];

          for (const block of response.content) {
            if (block.type === "text" && block.text) {
              controller.enqueue({ text: block.text });
            }

            if (block.type === "tool_use") {
              hasToolUse = true;
              onToolStart?.(block.name);

              let result: string;
              const builtin = builtinTools.find((t) => t.name === block.name);
              if (builtin) {
                result = await builtin.execute(block.input as Record<string, unknown>);
              } else {
                result = await callMCPTool(block.name, block.input as Record<string, unknown>);
              }

              onToolEnd?.(block.name);
              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: result,
              });
            }
          }

          if (!hasToolUse) break;

          currentMessages = [
            ...currentMessages,
            { role: "assistant", content: response.content },
            { role: "user", content: toolResults },
          ];
        }

        controller.close();
      } catch (err) {
        controller.enqueue({
          text: `Error: ${err instanceof Error ? err.message : "Agent failed"}`,
        });
        controller.close();
      }
    },
  });
}

async function streamOpenAI(
  agent: AgentConfig,
  messages: { role: "user" | "assistant"; content: string }[],
  tools: Anthropic.Tool[],
  builtinTools: BuiltinTool[]
): Promise<ReadableStream<StreamChunk>> {
  let _client: OpenAI | null = null;
  function getClient() {
    if (!_client) _client = new OpenAI();
    return _client;
  }

  // Convert Anthropic tool format to OpenAI
  const openaiTools: OpenAI.ChatCompletionTool[] = tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description || "",
      parameters: t.input_schema as Record<string, unknown>,
    },
  }));

  return new ReadableStream({
    async start(controller) {
      try {
        let currentMessages: OpenAI.ChatCompletionMessageParam[] = [
          { role: "system", content: agent.systemPrompt },
          ...messages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ];

        while (true) {
          const hasTools = openaiTools.length > 0;
          const response = await getClient().chat.completions.create({
            model: agent.model,
            max_tokens: 2048,
            messages: currentMessages,
            ...(hasTools ? { tools: openaiTools } : {}),
          });

          const choice = response.choices[0];
          if (!choice) break;

          if (choice.message.content) {
            controller.enqueue({ text: choice.message.content });
          }

          if (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
            const toolMessages: OpenAI.ChatCompletionMessageParam[] = [
              { role: "assistant" as const, tool_calls: choice.message.tool_calls, content: choice.message.content },
            ];

            for (const call of choice.message.tool_calls) {
              if (call.type !== "function") continue;
              const fn = call as OpenAI.ChatCompletionMessageToolCall & { type: "function"; function: { name: string; arguments: string } };
              const input = JSON.parse(fn.function.arguments);
              const builtin = builtinTools.find((t) => t.name === fn.function.name);
              let result: string;

              if (builtin) {
                result = await builtin.execute(input);
              } else {
                result = await callMCPTool(fn.function.name, input);
              }

              toolMessages.push({
                role: "tool" as const,
                tool_call_id: call.id,
                content: result,
              });
            }

            currentMessages = [...currentMessages, ...toolMessages];
            continue;
          }

          break;
        }

        controller.close();
      } catch (err) {
        controller.enqueue({
          text: `Error: ${err instanceof Error ? err.message : "Agent failed"}`,
        });
        controller.close();
      }
    },
  });
}

// Legacy simple stream (no tools)
export async function streamAgent(
  agent: AgentConfig,
  messages: { role: "user" | "assistant"; content: string }[]
) {
  return streamAgentWithTools({ agent, messages });
}
