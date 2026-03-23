"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "tellet_onboarding_dismissed";

interface WelcomeProps {
  agentCount: number;
  conversationCount: number;
}

const steps = [
  { id: "agents", label: "AI team created", auto: true },
  { id: "migration", label: "Database migration", auto: true },
  { id: "conversation", label: "First conversation", auto: false },
  { id: "deploy", label: "Deploy to production", auto: false },
] as const;

export function Welcome({ agentCount, conversationCount }: WelcomeProps) {
  const [dismissed, setDismissed] = useState(true);
  const [deployChecked, setDeployChecked] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "true");
    setDeployChecked(localStorage.getItem("tellet_deploy_done") === "true");
  }, []);

  if (dismissed) return null;

  const checks = {
    agents: agentCount > 0,
    migration: agentCount > 0,
    conversation: conversationCount > 0,
    deploy: deployChecked,
  };

  const completed = Object.values(checks).filter(Boolean).length;
  const total = steps.length;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  };

  const toggleDeploy = () => {
    const next = !deployChecked;
    setDeployChecked(next);
    localStorage.setItem("tellet_deploy_done", String(next));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        className="rounded-xl border border-accent/20 bg-accent/5 p-6 mb-8"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Welcome to your AI company</h3>
            <p className="text-sm text-text-secondary mt-1">
              {completed}/{total} steps complete
            </p>
          </div>
          <button
            onClick={dismiss}
            className="text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="w-full bg-bg-tertiary rounded-full h-1.5 mb-5">
          <div
            className="bg-accent h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${(completed / total) * 100}%` }}
          />
        </div>

        <div className="space-y-3">
          {steps.map((step) => {
            const checked = checks[step.id];
            return (
              <div key={step.id} className="flex items-center gap-3">
                {step.id === "deploy" ? (
                  <button
                    onClick={toggleDeploy}
                    className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${
                      checked
                        ? "bg-accent border-accent"
                        : "border-border hover:border-accent/50"
                    }`}
                  >
                    {checked && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                ) : (
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                      checked
                        ? "bg-accent border-accent"
                        : "border-border"
                    }`}
                  >
                    {checked && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                )}
                <span className={`text-sm ${checked ? "text-text-tertiary line-through" : "text-text-primary"}`}>
                  {step.label}
                </span>
                {step.id === "migration" && !checked && (
                  <code className="text-xs bg-bg-tertiary px-2 py-0.5 rounded text-text-secondary ml-auto">
                    npx supabase db push
                  </code>
                )}
                {step.id === "deploy" && !checked && (
                  <code className="text-xs bg-bg-tertiary px-2 py-0.5 rounded text-text-secondary ml-auto">
                    vercel deploy
                  </code>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
