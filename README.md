# Tell it. Let it.

> AI agents that run your business — email, delegate, schedule, embed.

```bash
npx @tellet/create
```

Or start instantly at [tellet.com](https://tellet.com) — no setup required.

---

tellet generates an AI agent team for your business. Agents don't just chat — they send emails, delegate tasks to each other, run scheduled automations, and serve customers through an embeddable widget.

## What agents can do

- **Email customers** — Send follow-ups, confirmations, and outreach via Resend
- **Delegate to each other** — Support agent routes billing questions to sales automatically
- **Run on schedule** — Daily reports, weekly summaries, automated follow-ups via cron
- **Search knowledge** — Reference your product info, policies, and FAQ for accurate answers
- **Serve customers anywhere** — Embeddable widget for any website, one script tag

## Two ways to start

### Hosted (tellet.com) — recommended

1. Sign up at [tellet.com](https://tellet.com)
2. Describe your business in one sentence
3. AI generates your agent team with email, delegation, and scheduling
4. Embed the widget on your site, agents go to work

### Self-hosted (CLI)

```bash
npx @tellet/create
cd your-company
npm install && npm run dev
```

## How it works

```
You: "I run a coffee shop called Sunny Coffee"

  Generating your AI team...

  Your team:
  Barista (customer_support) — emails, knowledge, delegation
  Roaster (marketing)       — emails, knowledge, delegation
  Grinder (sales)           — emails, knowledge, delegation

  Orchestrator tools:
  ✓ schedule_task        — cron-based agent automation
  ✓ list_scheduled_tasks — view all schedules
  ✓ cancel_scheduled_task

  ✓ Your AI company is live!
```

## Architecture

```
┌─ tellet Platform ──────────────────────────────────┐
│                                                     │
│  Owner ↔ Orchestrator (schedule, manage, configure) │
│              ↕                                     │
│  Agent Team (CS · Marketing · Sales · Ops)         │
│     ↕ delegate_to_agent ↕                          │
│  Actions: email · search · schedule                │
│              ↕                                     │
│  Channels: dashboard · widget · cron               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Agent capabilities by role

| Role | search_knowledge | send_email | delegate_to_agent |
|------|:---:|:---:|:---:|
| customer_support | Y | Y | Y |
| sales | Y | Y | Y |
| marketing | Y | Y | Y |
| operations | Y | Y | Y |
| analytics | Y | - | Y |

## Orchestrator commands

The Orchestrator manages your AI company through conversation:

- "Schedule marketing to send a weekly summary every Monday 9am"
- "Show all scheduled tasks"
- "Add our refund policy to the Knowledge Base"
- "Update the support agent's system prompt"
- "Show my stats"

## Embeddable widget

Add AI chat to any website:

```html
<script src="https://tellet.com/widget.js"></script>
<script>
  Tellet.init({ companyId: "your-company-id" });
</script>
```

Features: dark/light theme, streaming responses, session persistence, mobile responsive.

## Project structure (self-hosted)

```
your-company/
├─�� app/
│   ├── (site)/             # Public website with chat widget
│   ├── (dashboard)/        # Management dashboard + Orchestrator
│   └── api/
│       ├── chat/           # Agent chat (SSE, tool use loop)
│       ├── orchestrator/   # Orchestrator (scheduling, management)
│       ├── cron/           # Scheduled task execution
│       └── widget/         # Public widget API (CORS, no auth)
├── lib/
│   ├── engine/             # Agent runtime with agentic loop
│   ├── actions/            # Role-based tools (email, delegate, search)
│   ├── scheduling/         # Cron parser + task executor
│   ├── orchestrator/       # Orchestrator tools + executor
│   ├── providers/          # LLM providers (Anthropic, OpenAI)
│   └── mcp/                # Knowledge base, tool registry
├── public/widget.js        # Embeddable chat widget
├── supabase/migrations/    # Database schema
└── vercel.json             # Cron configuration
```

## Tech stack

- [Next.js 16](https://nextjs.org/) — App framework
- [Supabase](https://supabase.com/) — Auth, database, pgvector, RLS
- [Anthropic Claude](https://anthropic.com/) / [OpenAI](https://openai.com/) — AI models
- [Resend](https://resend.com/) — Email delivery
- [Vercel Cron](https://vercel.com/docs/cron-jobs) — Scheduled task execution
- [Tailwind CSS 4](https://tailwindcss.com/) — Styling

## Environment variables

| Variable | Required | Description |
|----------|:---:|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Y | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Y | Supabase publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Y | Supabase service role key |
| `ANTHROPIC_API_KEY` | Y | Claude API key |
| `RESEND_API_KEY` | - | Resend API key (for email) |
| `CRON_SECRET` | - | Secret for cron endpoint auth |

## License

MIT

## Links

- [tellet.com](https://tellet.com) — Hosted platform (free)
- [GitHub](https://github.com/agentic-company/tellet) — Source code
- [npm](https://www.npmjs.com/package/@tellet/create) — CLI package
