import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { getConfig } from "@/lib/tellet";
import type Anthropic from "@anthropic-ai/sdk";

interface MCPConnection {
  client: Client;
  tools: Anthropic.Tool[];
}

const connections = new Map<string, MCPConnection>();

export async function connectMCPServer(
  name: string,
  command: string,
  args: string[],
  env?: Record<string, string>
): Promise<MCPConnection> {
  if (connections.has(name)) return connections.get(name)!;

  const transport = new StdioClientTransport({
    command,
    args,
    env: { ...process.env, ...env } as Record<string, string>,
  });

  const client = new Client({ name: `tellet-${name}`, version: "1.0.0" });
  await client.connect(transport);

  const { tools: mcpTools } = await client.listTools();

  const tools: Anthropic.Tool[] = mcpTools.map((t) => ({
    name: `${name}__${t.name}`,
    description: t.description || "",
    input_schema: (t.inputSchema || { type: "object", properties: {} }) as Anthropic.Tool.InputSchema,
  }));

  const conn = { client, tools };
  connections.set(name, conn);
  return conn;
}

export async function callMCPTool(
  qualifiedName: string,
  input: Record<string, unknown>
): Promise<string> {
  const [serverName, toolName] = qualifiedName.split("__", 2);
  const conn = connections.get(serverName);
  if (!conn) throw new Error(`MCP server "${serverName}" not connected`);

  const result = await conn.client.callTool({ name: toolName, arguments: input });
  return typeof result.content === "string"
    ? result.content
    : JSON.stringify(result.content);
}

export async function getToolsForAgent(agentId: string): Promise<Anthropic.Tool[]> {
  const config = getConfig();
  const agentConfig = config.agents.find((a) => a.id === agentId);
  if (!agentConfig) return [];

  const tools: Anthropic.Tool[] = [];
  const agentTools = (agentConfig as { tools?: string[] }).tools || [];

  for (const toolId of agentTools) {
    const toolConfig = (config as { tools?: Record<string, { type: string; package?: string; env?: Record<string, string>; description?: string }> }).tools?.[toolId];
    if (!toolConfig) continue;

    if (toolConfig.type === "builtin") {
      // Built-in tools are handled separately (e.g., search_knowledge)
      continue;
    }

    if (toolConfig.type === "mcp" && toolConfig.package) {
      try {
        const conn = await connectMCPServer(
          toolId,
          "npx",
          ["-y", toolConfig.package],
          toolConfig.env
        );
        tools.push(...conn.tools);
      } catch (err) {
        console.error(`Failed to connect MCP server "${toolId}":`, err);
      }
    }
  }

  return tools;
}

export async function disconnectAll(): Promise<void> {
  for (const [, conn] of connections) {
    await conn.client.close();
  }
  connections.clear();
}
