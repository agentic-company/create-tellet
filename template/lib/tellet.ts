import fs from "fs";
import path from "path";

export interface TelletConfig {
  version: string;
  company: { name: string; description: string; industry: string };
  engine: string;
  llm: { provider: string; defaultModel: string; fallback: string | null };
  agents: {
    id: string;
    name: string;
    role: string;
    model: string;
    channels: string[];
    tools?: string[];
  }[];
  tools?: Record<string, {
    type: string;
    package?: string;
    env?: Record<string, string>;
    description?: string;
  }>;
  channels: Record<string, { enabled: boolean }>;
  storage: string;
  integrations: string[];
  site: {
    tagline: string;
    subtitle: string;
    features: { title: string; description: string; icon: string }[];
    faq: { question: string; answer: string }[];
    cta: string;
  };
}

let _config: TelletConfig | null = null;

export function getConfig(): TelletConfig {
  if (_config) return _config;
  const raw = fs.readFileSync(
    path.join(process.cwd(), "tellet.json"),
    "utf-8"
  );
  _config = JSON.parse(raw) as TelletConfig;
  return _config;
}
