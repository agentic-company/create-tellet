"use client";

import { useState } from "react";
import { AgentChat } from "./AgentChat";

interface Agent {
  id: string;
  name: string;
  role: string;
  model: string;
  status: string;
  system_prompt: string;
}

export function AgentsListClient({ agents }: { agents: Agent[] }) {
  const [chatAgent, setChatAgent] = useState<Agent | null>(null);

  if (!agents || agents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-bg-secondary/20 p-8 text-center">
        <p className="text-text-secondary text-sm">No agents configured.</p>
        <p className="text-text-tertiary text-xs mt-1">
          Check your tellet.json and run the database migration.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="rounded-xl border border-border bg-bg-secondary/50 p-5"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-accent/10 text-accent text-sm font-bold flex items-center justify-center">
                {agent.name[0]}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{agent.name}</p>
                <p className="text-sm text-text-secondary capitalize">
                  {agent.role.replace("_", " ")} &middot; {agent.model}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      agent.status === "active" ? "bg-green-400" : "bg-text-tertiary"
                    }`}
                  />
                  <span className="text-xs text-text-secondary capitalize">
                    {agent.status}
                  </span>
                </div>
                <button
                  onClick={() => setChatAgent(agent)}
                  className="text-xs text-text-secondary border border-border rounded-lg px-3 py-1.5 hover:border-accent hover:text-accent transition-colors cursor-pointer"
                >
                  Chat now
                </button>
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-bg-primary border border-border p-3">
              <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">
                System Prompt
              </p>
              <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
                {agent.system_prompt}
              </p>
            </div>
          </div>
        ))}
      </div>

      {chatAgent && (
        <AgentChat
          agent={chatAgent}
          onClose={() => setChatAgent(null)}
        />
      )}
    </>
  );
}
