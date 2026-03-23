"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/chat/Markdown";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function OrchestratorChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, toolStatus]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");

    const newMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(newMessages);
    setStreaming(true);
    setMessages((p) => [...p, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder
          .decode(value)
          .split("\n")
          .filter((l) => l.startsWith("data: "))) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.text) {
              setMessages((p) => {
                const u = [...p];
                const last = u[u.length - 1];
                if (last.role === "assistant")
                  u[u.length - 1] = { ...last, content: last.content + data.text };
                return u;
              });
            }

            if (data.tool) {
              setToolStatus(
                data.status === "running"
                  ? `Running ${data.tool.replace("_", " ")}...`
                  : null
              );
            }

            if (data.error) {
              setMessages((p) => {
                const u = [...p];
                u[u.length - 1] = { role: "assistant", content: `Error: ${data.error}` };
                return u;
              });
            }
          } catch {}
        }
      }
    } catch {
      setMessages((p) => {
        const u = [...p];
        u[u.length - 1] = { role: "assistant", content: "Connection error." };
        return u;
      });
    } finally {
      setStreaming(false);
      setToolStatus(null);
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-5 py-3 shadow-lg transition-all cursor-pointer",
          open
            ? "bg-bg-secondary border border-border"
            : "bg-accent hover:bg-accent-hover text-white shadow-[0_0_30px_var(--color-accent-glow)]"
        )}
      >
        {open ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
            <span className="text-sm font-medium">Orchestrator</span>
          </>
        )}
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-20 right-6 z-50 w-[420px] max-h-[600px] rounded-2xl border border-border bg-bg-primary shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-border bg-bg-secondary/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-accent/20 text-accent flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold">Orchestrator</p>
                  <p className="text-[11px] text-text-tertiary">
                    Manage your company with AI
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px] max-h-[420px]">
              {messages.length === 0 && (
                <div className="text-center py-8 space-y-3">
                  <p className="text-sm text-text-secondary">
                    I can help you manage your AI company.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[
                      "Show my stats",
                      "List my agents",
                      "Update the website tagline",
                      "Recent conversations",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setInput(suggestion);
                        }}
                        className="text-xs bg-bg-secondary border border-border rounded-lg px-3 py-1.5 text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors cursor-pointer"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex",
                    m.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-xl px-3 py-2 max-w-[85%] text-sm leading-relaxed",
                      m.role === "user"
                        ? "bg-accent text-white"
                        : "bg-bg-secondary text-text-primary border border-border"
                    )}
                  >
                    {m.content ? (
                      <Markdown content={m.content} />
                    ) : (
                      <span className="inline-flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-pulse" />
                        <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-pulse [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-pulse [animation-delay:300ms]" />
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {toolStatus && (
                <div className="flex items-center gap-2 text-xs text-accent">
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {toolStatus}
                </div>
              )}

              <div ref={endRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="px-3 py-3 border-t border-border flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tell me what to do..."
                disabled={streaming}
                className="flex-1 rounded-lg bg-bg-secondary border border-border px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                className="rounded-lg bg-accent px-3 py-2 text-white text-sm hover:bg-accent-hover disabled:opacity-50 cursor-pointer transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
