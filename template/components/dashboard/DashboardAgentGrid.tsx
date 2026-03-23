"use client";

import { useState } from "react";
import { AgentChat } from "./AgentChat";

interface Agent {
  id: string;
  name: string;
  role: string;
  status: string;
}

const roleColors: Record<string, string> = {
  customer_support: "bg-green-500/10 text-green-400 border-green-500/20",
  marketing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  sales: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  operations: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  development: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  analytics: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export function DashboardAgentGrid({ agents }: { agents: Agent[] }) {
  const [chatAgent, setChatAgent] = useState<Agent | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="rounded-xl border border-border bg-bg-secondary/50 p-5 transition-colors hover:border-border-hover"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-semibold">{agent.name}</span>
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                  roleColors[agent.role] || "bg-bg-tertiary text-text-secondary border-border"
                }`}
              >
                {agent.role.replace("_", " ")}
              </span>
            </div>
            <div className="flex items-center justify-between">
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
                Chat
              </button>
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
