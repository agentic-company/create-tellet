# create-tellet

> Build your AI company in one command.

```bash
npx create-tellet
```

tellet is an open-source framework that generates a complete AI-powered company from a business description. No YAML. No config files. AI creates your agent team with tailored system prompts, roles, and models.

## How it works

1. **Run one command** — answer a few questions about your business
2. **AI builds your team** — Claude generates 3-5 agents custom-tailored to your needs
3. **Deploy and go live** — `vercel deploy` and your AI company is operational

## What you get

- **AI Agents** — Customer support, marketing, sales, and more — each with business-specific system prompts
- **Dashboard** — Monitor agent activity, review conversations, track costs
- **Chat Widget** — Embeddable customer-facing chat, powered by your CS agent
- **Pluggable Architecture** — Swap LLM providers, channels, storage, and engine independently

## Architecture

Every layer is pluggable. Start with defaults, swap anything later.

| Layer | Default | Options |
|-------|---------|---------|
| **Engine** | Default (lightweight) | OpenClaw (advanced orchestration) |
| **LLM** | Anthropic (Claude) | OpenAI, OpenRouter, Google |
| **Channels** | Web Chat | Slack, Email, Discord, WhatsApp |
| **Storage** | Supabase | PostgreSQL, SQLite |

Each agent can use a different LLM provider and model:

```json
{
  "agents": [
    { "id": "support", "model": "claude-haiku-4-5", "provider": "anthropic" },
    { "id": "marketing", "model": "gpt-4.1-mini", "provider": "openai" }
  ]
}
```

## Prerequisites

- Node.js 20+
- [Anthropic API key](https://console.anthropic.com/)
- [Supabase project](https://supabase.com/) (free tier works)

## Quick start

```bash
# Create your AI company
npx create-tellet

# Install and run
cd your-company
npm install
npm run dev

# Deploy
vercel deploy
```

## Project structure

```
your-company/
├── agents/              # AI agent definitions (auto-generated)
├── app/
│   ├── (site)/          # Public website with chat widget
│   ├── (dashboard)/     # Management dashboard
│   └── api/chat/        # Streaming chat API
├── lib/
│   ├── engine/          # Agent runtime (pluggable)
│   ├── providers/       # LLM providers (pluggable)
│   └── storage/         # Database layer (pluggable)
├── tellet.json          # Configuration (single source of truth)
└── supabase/migrations/ # Database schema
```

## Configuration

All configuration lives in `tellet.json`:

```json
{
  "company": { "name": "...", "description": "...", "industry": "..." },
  "engine": "default",
  "llm": { "provider": "anthropic", "defaultModel": "claude-sonnet-4-6" },
  "channels": { "web_chat": { "enabled": true } },
  "storage": "supabase"
}
```

## Tech stack

- [Next.js](https://nextjs.org/) — App framework
- [Supabase](https://supabase.com/) — Database + Auth
- [Anthropic Claude](https://anthropic.com/) — AI models
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [Framer Motion](https://www.framer.com/motion/) — Animations

## License

MIT

## Links

- [tellet.com](https://tellet.com) — Website
- [GitHub](https://github.com/agentic-company/create-tellet) — Source code
