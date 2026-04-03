#!/usr/bin/env node

import * as p from "@clack/prompts";
import chalk from "chalk";
import { generateAgents, type Provider } from "./ai/generate.js";
import { scaffoldProject, type DeployTier } from "./scaffold/project.js";

async function main() {
  console.clear();
  console.log();
  console.log(
    chalk.bold(
      `  ${chalk.white("tel")}${chalk.yellow("let")} ${chalk.dim("— Build Your AI Company")}`
    )
  );
  console.log();

  p.intro(chalk.bgHex("#8b5cf6").white(" @tellet/create "));

  // Step 0: New or Connect
  const modeChoice = await p.select({
    message: "What would you like to do?",
    options: [
      {
        value: "new",
        label: "New",
        hint: "Build a new AI company from scratch",
      },
      {
        value: "connect",
        label: "Connect",
        hint: "Add AI agents to your existing business",
      },
    ],
  });

  if (p.isCancel(modeChoice)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }

  const mode = modeChoice as "new" | "connect";

  // Step 1: Company info
  const company = await p.group(
    {
      name: () =>
        p.text({
          message: "What's your company name?",
          placeholder: "Sunny Coffee",
          validate: (v) => (!v ? "Company name is required" : undefined),
        }),
      description: () =>
        p.text({
          message:
            "Describe your business (what you do, who your customers are, what help you need):",
          placeholder:
            "We sell specialty coffee subscriptions. Customers are coffee enthusiasts aged 25-45...",
          validate: (v) =>
            !v || v.length < 20
              ? "Please provide at least a few sentences"
              : undefined,
        }),
    },
    {
      onCancel: () => {
        p.cancel("Setup cancelled.");
        process.exit(0);
      },
    }
  );

  // Step 2: Deployment tier
  const tierChoice = await p.select({
    message: "Deployment mode:",
    options: [
      {
        value: "quickstart",
        label: "Quick Start",
        hint: "Vercel + Supabase — free, instant deploy",
      },
      {
        value: "cloud",
        label: "Cloud",
        hint: "Railway / Render / Fly.io — Docker, $5-20/mo",
      },
      {
        value: "enterprise",
        label: "Enterprise",
        hint: "AWS CDK — auto-provision Lambda + RDS + CloudFront",
      },
    ],
  });

  if (p.isCancel(tierChoice)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }

  const tier = tierChoice as DeployTier;

  // Step 3: Choose AI provider
  const providerChoice = await p.select({
    message: "Choose your AI provider:",
    options: [
      {
        value: "anthropic",
        label: "Anthropic (Claude)",
        hint: "recommended — also powers the Orchestrator",
      },
      {
        value: "openai",
        label: "OpenAI (GPT)",
        hint: "uses gpt-4.1 for generation",
      },
    ],
  });

  if (p.isCancel(providerChoice)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }

  const provider = providerChoice as Provider;

  // Step 4: Get API key
  const envKey =
    provider === "anthropic"
      ? process.env.ANTHROPIC_API_KEY
      : process.env.OPENAI_API_KEY;
  const envName =
    provider === "anthropic" ? "ANTHROPIC_API_KEY" : "OPENAI_API_KEY";
  const keyPrefix = provider === "anthropic" ? "sk-ant-" : "sk-";
  const keyPlaceholder = provider === "anthropic" ? "sk-ant-..." : "sk-...";

  let apiKey = envKey || "";
  if (!apiKey) {
    const keyInput = await p.text({
      message: `Your ${provider === "anthropic" ? "Anthropic" : "OpenAI"} API key:`,
      placeholder: keyPlaceholder,
      validate: (v) =>
        !v || !v.startsWith(keyPrefix)
          ? `Please enter a valid key (starts with ${keyPrefix})`
          : undefined,
    });
    if (p.isCancel(keyInput)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }
    apiKey = keyInput as string;
    process.env[envName] = apiKey;
  } else {
    p.log.info(chalk.dim(`Using ${envName} from environment.`));
  }

  // Orchestrator always needs Anthropic
  let anthropicKey = "";
  if (provider === "anthropic") {
    anthropicKey = apiKey;
  } else {
    const existingKey = process.env.ANTHROPIC_API_KEY || "";
    if (existingKey) {
      anthropicKey = existingKey;
      p.log.info(chalk.dim("Using ANTHROPIC_API_KEY for Orchestrator."));
    } else {
      p.log.info(
        chalk.dim("The Orchestrator requires an Anthropic API key (Claude tool use).")
      );
      const orchKeyInput = await p.text({
        message: "Anthropic API key for Orchestrator:",
        placeholder: "sk-ant-...",
        validate: (v) =>
          !v || !v.startsWith("sk-ant-")
            ? "Please enter a valid Anthropic key (starts with sk-ant-)"
            : undefined,
      });
      if (p.isCancel(orchKeyInput)) {
        p.cancel("Setup cancelled.");
        process.exit(0);
      }
      anthropicKey = orchKeyInput as string;
    }
  }

  // Step 5: Generate agents + site content
  const s = p.spinner();
  s.start("Generating your AI team and website...");

  let agents;
  try {
    agents = await generateAgents(
      company.name as string,
      company.description as string,
      provider
    );
    s.stop("Your AI team is ready!");
  } catch (err) {
    s.stop("Failed to generate agents.");
    p.log.error(err instanceof Error ? err.message : "Check your API key");
    p.cancel("Setup failed.");
    process.exit(1);
  }

  // Step 6: Show agents + site preview
  p.log.info(chalk.bold("Meet your team:"));
  console.log();
  for (const agent of agents.agents) {
    console.log(
      `  ${chalk.hex("#8b5cf6").bold(agent.name)} ${chalk.dim(`(${agent.role})`)}`
    );
    console.log(`  ${chalk.dim(agent.description)}`);
    console.log();
  }

  if (agents.site && mode === "new") {
    p.log.info(chalk.bold("Your website:"));
    console.log(`  ${chalk.hex("#f59e0b")(agents.site.tagline)}`);
    console.log(`  ${chalk.dim(agents.site.subtitle)}`);
    console.log();
  }

  const confirm = await p.confirm({
    message: "Looks good?",
    initialValue: true,
  });

  if (p.isCancel(confirm) || !confirm) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }

  // Step 7a: Connect mode — website URL for KB
  let websiteUrl = "";
  if (mode === "connect") {
    const urlInput = await p.text({
      message: "Your existing website URL (for Knowledge Base crawling):",
      placeholder: "https://my-business.com",
    });
    if (!p.isCancel(urlInput) && urlInput) {
      websiteUrl = urlInput as string;
    }
  }

  // Step 7b: Infrastructure setup (tier-dependent)
  let supabaseUrl = "";
  let supabaseKey = "";

  if (tier === "quickstart") {
    p.log.info(
      `${chalk.bold("Supabase setup")} ${chalk.dim("(free tier works fine)")}\n` +
        `  ${chalk.dim("1.")} Create a project at ${chalk.cyan("https://supabase.com/dashboard/new")}\n` +
        `  ${chalk.dim("2.")} Go to Settings → API to find your URL and keys`
    );

    const supabase = await p.group(
      {
        url: () =>
          p.text({
            message: "Your Supabase project URL:",
            placeholder: "https://xxx.supabase.co",
            validate: (v) =>
              !v || !v.includes("supabase")
                ? "Please enter a valid Supabase URL"
                : undefined,
          }),
        key: () =>
          p.text({
            message: "Your Supabase publishable key (anon/public):",
            placeholder: "sb_publishable_...",
            validate: (v) => (!v ? "Key is required" : undefined),
          }),
      },
      {
        onCancel: () => {
          p.cancel("Setup cancelled.");
          process.exit(0);
        },
      }
    );
    supabaseUrl = supabase.url as string;
    supabaseKey = supabase.key as string;
  } else if (tier === "cloud") {
    p.log.info(
      chalk.dim("Cloud mode: PostgreSQL runs in Docker. No Supabase needed.")
    );
  } else {
    p.log.info(
      `${chalk.bold("AWS Enterprise setup")}\n` +
        `  ${chalk.dim("Requires:")} AWS CLI configured + CDK bootstrapped\n` +
        `  ${chalk.dim("Cost:")} ~$5-15/mo (Lambda + RDS free tier)`
    );
  }

  // Step 8: Scaffold project
  s.start("Creating your project...");

  try {
    const projectDir = await scaffoldProject({
      company: {
        name: company.name as string,
        description: company.description as string,
        industry: agents.industry,
      },
      agents: agents.agents,
      site: agents.site,
      provider,
      tier,
      mode,
      websiteUrl,
      infra: {
        anthropicKey,
        openaiKey: provider === "openai" ? apiKey : undefined,
        supabaseUrl,
        supabaseKey,
      },
    });

    s.stop("Project created!");

    const slug = (company.name as string)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const widgetSnippet = mode === "connect"
      ? [
          ``,
          `${chalk.bold("Embed in your existing site:")}`,
          `${chalk.cyan('<script src="https://YOUR_URL/widget.js"')}`,
          `${chalk.cyan('  data-agent="' + agents.agents[0].id + '"')}`,
          `${chalk.cyan('  data-api="https://YOUR_URL"></script>')}`,
        ]
      : [];

    if (tier === "quickstart") {
      p.note(
        [
          `cd ${slug}`,
          `npm install`,
          `npm run dev        ${chalk.dim("→ http://localhost:3000")}`,
          ``,
          `Dashboard:    ${chalk.dim("/dashboard")}`,
          `Orchestrator: ${chalk.dim("floating button in dashboard")}`,
          `Agents:       ${chalk.dim(`${agents.agents.length} active`)}`,
          ...widgetSnippet,
        ].join("\n"),
        mode === "connect" ? "Your AI agents are ready" : "Your AI company is ready"
      );
      p.outro(`Deploy: ${chalk.cyan("vercel deploy")}`);
    } else if (tier === "cloud") {
      p.note(
        [
          `cd ${slug}`,
          ``,
          `${chalk.bold("Local development:")}`,
          `docker compose up     ${chalk.dim("→ http://localhost:3000")}`,
          ``,
          `${chalk.bold("Deploy to Railway:")}`,
          `railway login`,
          `railway init`,
          `railway add --plugin postgresql`,
          `railway up`,
          ``,
          `Dashboard:    ${chalk.dim("/dashboard")}`,
          `Orchestrator: ${chalk.dim("floating button in dashboard")}`,
          `Agents:       ${chalk.dim(`${agents.agents.length} active`)}`,
        ].join("\n"),
        "Your AI company is ready"
      );
      p.outro(
        `Or deploy to ${chalk.cyan("Render")}, ${chalk.cyan("Fly.io")}, or any Docker host`
      );
    } else {
      p.note(
        [
          `cd ${slug}`,
          ``,
          `${chalk.bold("Local development:")}`,
          `docker compose up     ${chalk.dim("→ http://localhost:3000")}`,
          ``,
          `${chalk.bold("Deploy to AWS:")}`,
          `cd infra`,
          `npm install`,
          `npx cdk bootstrap     ${chalk.dim("(first time only)")}`,
          `npx cdk deploy        ${chalk.dim("→ CloudFront URL in output")}`,
          ``,
          `${chalk.bold("Update API keys:")}`,
          `aws secretsmanager put-secret-value \\`,
          `  --secret-id ${slug}/api-keys \\`,
          `  --secret-string '{"ANTHROPIC_API_KEY":"sk-ant-..."}'`,
          ``,
          `Dashboard:    ${chalk.dim("/dashboard")}`,
          `Orchestrator: ${chalk.dim("floating button in dashboard")}`,
          `Agents:       ${chalk.dim(`${agents.agents.length} active`)}`,
          `Est. cost:    ${chalk.dim("$5-15/mo")}`,
        ].join("\n"),
        "Your AI company is ready (AWS)"
      );
      p.outro(
        `Run ${chalk.cyan("cd infra && npx cdk deploy")} to provision AWS infrastructure`
      );
    }
  } catch (err) {
    s.stop("Failed to create project.");
    p.log.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main().catch(console.error);
