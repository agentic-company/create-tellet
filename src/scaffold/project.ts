import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

interface AgentConfig {
  id: string;
  name: string;
  role: string;
  description: string;
  systemPrompt: string;
  model: string;
}

interface SiteContent {
  tagline: string;
  subtitle: string;
  features: { title: string; description: string; icon: string }[];
  faq: { question: string; answer: string }[];
  cta: string;
}

interface ScaffoldOptions {
  company: {
    name: string;
    description: string;
    industry: string;
  };
  agents: AgentConfig[];
  site: SiteContent;
  provider: "anthropic" | "openai";
  infra: {
    anthropicKey: string;
    openaiKey?: string;
    supabaseUrl: string;
    supabaseKey: string;
  };
}

export async function scaffoldProject(options: ScaffoldOptions): Promise<string> {
  const { company, agents, site, provider, infra } = options;

  const slug = company.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const projectDir = path.resolve(process.cwd(), slug);

  if (await fs.pathExists(projectDir)) {
    throw new Error(`Directory "${slug}" already exists`);
  }

  // Copy template
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const templateDir = path.resolve(__dirname, "..", "..", "template");

  if (await fs.pathExists(templateDir)) {
    await fs.copy(templateDir, projectDir);
  } else {
    await fs.mkdirp(projectDir);
  }

  // Ensure directory structure
  const dirs = [
    "app/(site)",
    "app/(dashboard)/dashboard",
    "app/(dashboard)/agents",
    "app/(dashboard)/conversations",
    "app/(dashboard)/settings",
    "app/api/chat",
    "app/api/agents",
    "app/login",
    "agents",
    "channels",
    "components/chat",
    "components/dashboard",
    "components/ui",
    "lib/engine",
    "lib/providers",
    "lib/storage",
    "supabase/migrations",
  ];

  for (const dir of dirs) {
    await fs.mkdirp(path.join(projectDir, dir));
  }

  // Write tellet.json
  const telletConfig = {
    $schema: "https://tellet.com/schema/v1.json",
    version: "1.0.0",
    company: {
      name: company.name,
      description: company.description,
      industry: company.industry,
    },
    engine: "default",
    llm: {
      provider,
      defaultModel: provider === "openai" ? "gpt-4.1" : "claude-sonnet-4-6",
      fallback: null,
    },
    agents: agents.map((a) => ({
      id: a.id,
      name: a.name,
      role: a.role,
      model: a.model,
      channels: ["web_chat"],
      tools: a.role === "customer_support" ? ["search_knowledge"] : [],
    })),
    tools: {
      search_knowledge: {
        type: "builtin",
        description: "Search company knowledge base",
      },
    },
    channels: {
      web_chat: { enabled: true },
      slack: { enabled: false },
      email: { enabled: false },
    },
    storage: "supabase",
    integrations: [],
    site,
  };

  await fs.writeJSON(path.join(projectDir, "tellet.json"), telletConfig, {
    spaces: 2,
  });

  // Write .env.local
  const envLines = [
    `# Orchestrator (always Anthropic)`,
    `ANTHROPIC_API_KEY=${infra.anthropicKey}`,
  ];
  if (infra.openaiKey) {
    envLines.push(`OPENAI_API_KEY=${infra.openaiKey}`);
  }
  envLines.push(
    `NEXT_PUBLIC_SUPABASE_URL=${infra.supabaseUrl}`,
    `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${infra.supabaseKey}`
  );
  await fs.writeFile(
    path.join(projectDir, ".env.local"),
    envLines.join("\n") + "\n"
  );

  // Write agent files
  for (const agent of agents) {
    const agentFile = `import { defineAgent } from "@/lib/engine";

export default defineAgent({
  id: "${agent.id}",
  name: "${agent.name}",
  role: "${agent.role}",
  model: "${agent.model}",
  systemPrompt: ${JSON.stringify(agent.systemPrompt)},
  channels: ["web_chat"],
  tools: [],
});
`;
    await fs.writeFile(
      path.join(projectDir, "agents", `${agent.id}.ts`),
      agentFile
    );
  }

  // Write agents/index.ts (registry)
  const imports = agents
    .map((a) => `import ${a.id} from "./${a.id}.js";`)
    .join("\n");
  const exports = agents.map((a) => `  ${a.id}`).join(",\n");

  await fs.writeFile(
    path.join(projectDir, "agents", "index.ts"),
    `${imports}\n\nexport const agents = {\n${exports},\n};\n`
  );

  // Write package.json
  await fs.writeJSON(
    path.join(projectDir, "package.json"),
    {
      name: slug,
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
      },
      dependencies: {
        next: "^16.2.0",
        react: "^19.2.0",
        "react-dom": "^19.2.0",
        "@anthropic-ai/sdk": "^0.80.0",
        openai: "^6.32.0",
        "@modelcontextprotocol/sdk": "^1.12.0",
        "@supabase/supabase-js": "^2.99.0",
        "@supabase/ssr": "^0.9.0",
        tailwindcss: "^4.0.0",
        "@tailwindcss/postcss": "^4.0.0",
        "framer-motion": "^12.0.0",
        clsx: "^2.1.0",
        "tailwind-merge": "^3.0.0",
      },
      devDependencies: {
        typescript: "^5.0.0",
        "@types/node": "^22.0.0",
        "@types/react": "^19.0.0",
      },
    },
    { spaces: 2 }
  );

  // Write postcss.config.mjs
  await fs.writeFile(
    path.join(projectDir, "postcss.config.mjs"),
    `/** @type {import('postcss-load-config').Config} */\nconst config = {\n  plugins: {\n    "@tailwindcss/postcss": {},\n  },\n};\n\nexport default config;\n`
  );

  // Write DB migration
  await fs.writeFile(
    path.join(projectDir, "supabase", "migrations", "001_initial.sql"),
    generateMigration(agents)
  );

  return projectDir;
}

function generateMigration(agents: AgentConfig[]): string {
  const seedValues = agents
    .map(
      (a) =>
        `('${a.id}', '${a.name}', '${a.role}', ${pgEscape(a.systemPrompt)}, '${a.model}', 'active', '{}')`
    )
    .join(",\n");

  return `-- tellet schema

-- Knowledge Base (pgvector)
create extension if not exists vector;

create table documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  embedding vector(1536),
  category text default 'general',
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index on documents using ivfflat (embedding vector_cosine_ops) with (lists = 50);

create or replace function match_documents(
  query_embedding vector(1536),
  match_count int default 3,
  match_threshold float default 0.5
)
returns table (id uuid, title text, content text, category text, similarity float)
language sql stable
as $$
  select
    d.id, d.title, d.content, d.category,
    1 - (d.embedding <=> query_embedding) as similarity
  from documents d
  where 1 - (d.embedding <=> query_embedding) > match_threshold
  order by d.embedding <=> query_embedding
  limit match_count;
$$;

-- Core tables
create table agents (
  id text primary key,
  name text not null,
  role text not null,
  system_prompt text not null,
  model text default 'claude-sonnet-4-6',
  status text default 'active',
  config jsonb default '{}',
  created_at timestamptz default now()
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  agent_id text references agents(id),
  channel text not null,
  visitor_id text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  tokens_used integer default 0,
  created_at timestamptz default now()
);

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  agent_id text references agents(id),
  action text not null,
  summary text,
  cost_usd numeric(10,4) default 0,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Indexes
create index idx_conv_agent on conversations(agent_id);
create index idx_msg_conv on messages(conversation_id);
create index idx_activity_agent on activity_log(agent_id);
create index idx_activity_time on activity_log(created_at desc);

-- RLS
alter table documents enable row level security;
alter table agents enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table activity_log enable row level security;

create policy "auth_all" on documents for all to authenticated using (true) with check (true);
create policy "anon_read_docs" on documents for select to anon using (true);

create policy "auth_all" on agents for all to authenticated using (true) with check (true);
create policy "auth_all" on conversations for all to authenticated using (true) with check (true);
create policy "auth_all" on messages for all to authenticated using (true) with check (true);
create policy "auth_all" on activity_log for all to authenticated using (true) with check (true);

create policy "anon_read_agents" on agents for select to anon using (status = 'active');
create policy "anon_insert_conv" on conversations for insert to anon with check (channel = 'web_chat');
create policy "anon_insert_msg" on messages for insert to anon with check (true);
create policy "anon_read_msg" on messages for select to anon using (true);
create policy "anon_read_conv" on conversations for select to anon using (true);
create policy "anon_read_activity" on activity_log for select to anon using (true);

-- Realtime
alter publication supabase_realtime add table activity_log;
alter publication supabase_realtime add table messages;

-- Seed agents
insert into agents (id, name, role, system_prompt, model, status, config) values
${seedValues};
`;
}

function pgEscape(str: string): string {
  return "'" + str.replace(/'/g, "''") + "'";
}

