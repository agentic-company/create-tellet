# Tell it. Let it.

> The open-source platform for running an Agentic Company.

```bash
npx create-tellet
```

tellet is a management platform for AI-powered companies. One command generates your AI agent team, website, dashboard, Knowledge Base, and Orchestrator — ready to deploy anywhere.

## What you get

- **AI Agent Team** — 3-5 agents auto-generated for your business (CS, marketing, sales, ops)
- **Orchestrator** — Manage your entire company through conversation
- **Knowledge Base** — pgvector-powered, agents reference it for accurate answers
- **Dashboard** — Stats, agent chat, conversations, onboarding
- **Tool Marketplace** — Stripe, Email, GitHub, Slack, Notion via MCP
- **Embeddable Widget** — One script tag to add AI chat to any website
- **3-Tier Deployment** — Free (Vercel) / Cloud (Railway) / Enterprise (AWS)

## How it works

```
npx create-tellet

? New or Connect?          → New business or add AI to existing
? Deployment?              → Quick Start / Cloud / Enterprise
? AI Provider?             → Anthropic / OpenAI
? Company name?            → Sunny Coffee
? Describe your business   → We sell specialty coffee...

  Generating your AI team and website...

  Your team:
  Barista (customer_support)
  Roaster (marketing)
  Grinder (sales)

  Your website:
  "Coffee worth waking up for"

  ✓ Project created!
```

## Quick start

```bash
# Quick Start (Vercel + Supabase, free)
npx create-tellet
cd your-company
npm install && npm run dev

# Cloud (Docker + Railway, $5/mo)
npx create-tellet  # choose "Cloud"
cd your-company
docker compose up         # local dev
railway up                # deploy

# Enterprise (AWS CDK, $5-15/mo)
npx create-tellet  # choose "Enterprise"
cd your-company/infra
npm install && npx cdk deploy
```

## Architecture

```
┌─ tellet Platform ─────────────────────────┐
│  Owner ↔ Orchestrator                      │
│              ↕                             │
│  Agent Team (CS · Marketing · Sales · Ops) │
│              ↕                             │
│  MCP Bridge Layer                          │
│  (KB, Stripe, DB, Email, Custom API...)    │
└────────────────────────────────────────────┘
```

## Project structure

```
your-company/
├── agents/                # AI agent definitions (auto-generated)
├── app/
│   ├── (site)/            # Public website with chat widget
│   ├── (dashboard)/       # Management dashboard + Orchestrator
│   └── api/
│       ├── chat/          # Streaming chat API (tool use)
│       ├── orchestrator/  # Orchestrator API (tool use loop)
│       └── cron/          # Scheduled agent tasks
├── components/
│   ├── chat/              # ChatWidget, Markdown
│   ├── dashboard/         # Sidebar, Stats, AgentChat, Orchestrator
│   └── sections/          # Landing page sections
├── lib/
│   ├── engine/            # Agent runtime with tool use agentic loop
│   ├── providers/         # LLM providers (Anthropic, OpenAI)
│   ├── mcp/               # MCP client, Knowledge Base, tool registry
│   ├── orchestrator/      # Orchestrator tools + executor
│   └── scheduler.ts       # Cron/heartbeat agent scheduler
├── public/widget.js       # Embeddable chat widget
├── tellet.json            # Configuration (single source of truth)
├── Dockerfile             # Docker deployment (Cloud/Enterprise)
├── docker-compose.yml     # Local dev with PostgreSQL + pgvector
├── railway.toml           # Railway auto-deploy
└── infra/                 # AWS CDK (Enterprise only)
```

## Orchestrator

The Orchestrator is your AI company manager. Talk to it from the dashboard:

- "Show my stats" — conversations, messages, costs
- "Update the website tagline" — modifies site content
- "Add Stripe to my agents" — installs tools from marketplace
- "Schedule marketing to post daily at 9am" — sets up cron tasks
- "Add our refund policy to the Knowledge Base" — agents reference it

## Tool Marketplace

Connect tools via the Orchestrator or `tellet.json`:

| Tool | Package | Use case |
|------|---------|----------|
| Stripe | `@stripe/mcp` | Payments, invoices, subscriptions |
| Email | `resend-mcp` | Send emails, campaigns |
| GitHub | `@modelcontextprotocol/server-github` | Issues, PRs, repos |
| Slack | `@anthropic-ai/mcp-server-slack` | Messages, channels |
| Notion | `@anthropic-ai/mcp-server-notion` | Docs, databases |

19,000+ MCP servers available via the [MCP Registry](https://registry.modelcontextprotocol.io/).

## Deployment options

| Tier | Provider | Cost | Best for |
|------|----------|------|----------|
| Quick Start | Vercel + Supabase | $0 | Prototyping, new business |
| Cloud | Railway / Render / Fly.io | $5-20/mo | Production, startups |
| Enterprise | AWS CDK (Lambda + RDS) | $5-15/mo | Scale, existing AWS |

## Connect mode

Already have a business? Use Connect mode:

```bash
npx create-tellet  # choose "Connect"
```

- Skips site generation, keeps dashboard + API
- Embeddable widget for your existing site:

```html
<script src="https://your-tellet.com/widget.js"
        data-agent="support"
        data-api="https://your-tellet.com"></script>
```

## Configuration

All configuration lives in `tellet.json`:

```json
{
  "company": { "name": "Sunny Coffee", "industry": "Food & Beverage" },
  "mode": "new",
  "llm": { "provider": "anthropic", "defaultModel": "claude-sonnet-4-6" },
  "agents": [
    { "id": "barista", "role": "customer_support", "tools": ["search_knowledge"] },
    { "id": "roaster", "role": "marketing", "tools": ["email"] }
  ],
  "tools": {
    "search_knowledge": { "type": "builtin" },
    "email": { "type": "mcp", "package": "resend-mcp" }
  },
  "site": { "tagline": "Coffee worth waking up for", "..." : "..." }
}
```

## Tech stack

- [Next.js 16](https://nextjs.org/) — App framework
- [PostgreSQL + pgvector](https://github.com/pgvector/pgvector) — Database + vector search
- [MCP](https://modelcontextprotocol.io/) — Tool integration protocol
- [Anthropic Claude](https://anthropic.com/) / [OpenAI](https://openai.com/) — AI models
- [Tailwind CSS 4](https://tailwindcss.com/) — Styling
- [Framer Motion](https://www.framer.com/motion/) — Animations

## License

MIT

## Links

- [tellet.com](https://tellet.com) — Website
- [GitHub](https://github.com/agentic-company/tellet) — Source code
- [npm](https://www.npmjs.com/package/create-tellet) — Package
