import type Anthropic from "@anthropic-ai/sdk";

export const orchestratorTools: Anthropic.Tool[] = [
  {
    name: "list_agents",
    description:
      "List all AI agents in the company with their name, role, status, and model.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_stats",
    description:
      "Get company statistics: total conversations, messages, active agents, and estimated cost.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "update_agent_prompt",
    description:
      "Update an agent's system prompt. Use this when the owner wants to change how an agent behaves.",
    input_schema: {
      type: "object" as const,
      properties: {
        agent_id: {
          type: "string",
          description: "The agent ID to update",
        },
        system_prompt: {
          type: "string",
          description: "The new system prompt for the agent",
        },
      },
      required: ["agent_id", "system_prompt"],
    },
  },
  {
    name: "update_site_content",
    description:
      "Update the website content. Can update tagline, subtitle, features, FAQ, or CTA. Only include fields that need to change.",
    input_schema: {
      type: "object" as const,
      properties: {
        tagline: {
          type: "string",
          description: "New tagline for the website",
        },
        subtitle: {
          type: "string",
          description: "New subtitle for the website",
        },
        cta: {
          type: "string",
          description: "New call-to-action text",
        },
        features: {
          type: "array",
          description: "New features list",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              icon: { type: "string" },
            },
            required: ["title", "description", "icon"],
          },
        },
        faq: {
          type: "array",
          description: "New FAQ list",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              answer: { type: "string" },
            },
            required: ["question", "answer"],
          },
        },
      },
      required: [],
    },
  },
  {
    name: "get_recent_conversations",
    description:
      "Get recent conversations with message counts and agent info.",
    input_schema: {
      type: "object" as const,
      properties: {
        limit: {
          type: "number",
          description: "Number of conversations to return (default 10)",
        },
      },
      required: [],
    },
  },
  {
    name: "add_knowledge",
    description:
      "Add a document to the company knowledge base. Agents use this to answer customer questions accurately.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description: "Document title (e.g. 'Refund Policy')",
        },
        content: {
          type: "string",
          description: "Full document content",
        },
        category: {
          type: "string",
          description: "Category: policy, product, faq, or general",
        },
      },
      required: ["title", "content"],
    },
  },
  {
    name: "search_knowledge",
    description:
      "Search the knowledge base to check what information agents have access to.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search query",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "list_knowledge",
    description:
      "List all documents in the knowledge base.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "delete_knowledge",
    description:
      "Delete a document from the knowledge base by ID.",
    input_schema: {
      type: "object" as const,
      properties: {
        document_id: {
          type: "string",
          description: "The document ID to delete",
        },
      },
      required: ["document_id"],
    },
  },
];
