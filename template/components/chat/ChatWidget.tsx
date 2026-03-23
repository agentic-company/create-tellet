"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Markdown } from "./Markdown";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function ChatWidget({ agentId, agentName }: { agentId: string; agentName: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    setMessages((p) => [...p, { role: "user", content: text }]);
    setStreaming(true);
    setMessages((p) => [...p, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, agent_id: agentId, conversation_id: conversationId }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n").filter((l) => l.startsWith("data: "))) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.text) {
              setMessages((p) => {
                const u = [...p];
                const last = u[u.length - 1];
                if (last.role === "assistant") u[u.length - 1] = { ...last, content: last.content + data.text };
                return u;
              });
            }
            if (data.conversation_id) setConversationId(data.conversation_id);
          } catch {}
        }
      }
    } catch {
      setMessages((p) => { const u = [...p]; u[u.length - 1] = { role: "assistant", content: "Something went wrong." }; return u; });
    } finally { setStreaming(false); }
  };

  return (
    <>
      <button
        id="chat-trigger"
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer",
          open ? "bg-bg-secondary border border-border" : "bg-accent hover:bg-accent-hover shadow-[0_0_30px_var(--color-accent-glow)]"
        )}
      >
        {open ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" /></svg>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-h-[500px] rounded-2xl border border-border bg-bg-primary shadow-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-bg-secondary/50 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-accent/20 text-accent text-[10px] font-bold flex items-center justify-center">AI</span>
            <div><p className="text-sm font-semibold">{agentName}</p><p className="text-[11px] text-text-tertiary">Online</p></div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px] max-h-[340px]">
            {messages.length === 0 && <div className="text-center py-8"><p className="text-sm text-text-secondary">Ask me anything!</p></div>}
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn("rounded-xl px-3 py-2 max-w-[85%] text-sm leading-relaxed", m.role === "user" ? "bg-accent text-white" : "bg-bg-secondary text-text-primary border border-border")}>
                  {m.content ? <Markdown content={m.content} /> : <span className="inline-flex gap-1"><span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-pulse" /><span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-pulse [animation-delay:150ms]" /><span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-pulse [animation-delay:300ms]" /></span>}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="px-3 py-3 border-t border-border flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." disabled={streaming}
              className="flex-1 rounded-lg bg-bg-secondary border border-border px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent disabled:opacity-50" />
            <button type="submit" disabled={streaming || !input.trim()}
              className="rounded-lg bg-accent px-3 py-2 text-white text-sm hover:bg-accent-hover disabled:opacity-50 cursor-pointer transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
