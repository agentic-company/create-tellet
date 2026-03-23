import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("*, agents(name, role)")
    .eq("id", id)
    .single();

  if (!conversation) {
    return (
      <div className="space-y-6">
        <Link
          href="/conversations"
          className="text-sm text-text-tertiary hover:text-text-secondary transition-colors"
        >
          &larr; Back to conversations
        </Link>
        <div className="rounded-lg border border-dashed border-border bg-bg-secondary/20 p-8 text-center">
          <p className="text-text-secondary text-sm">Conversation not found.</p>
        </div>
      </div>
    );
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at");

  const agent = conversation.agents as { name: string; role: string };

  return (
    <div className="space-y-6">
      <Link
        href="/conversations"
        className="text-sm text-text-tertiary hover:text-text-secondary transition-colors"
      >
        &larr; Back to conversations
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-accent/10 text-accent text-sm font-bold flex items-center justify-center">
          {agent.name[0]}
        </div>
        <div>
          <h1 className="text-xl font-semibold">{agent.name}</h1>
          <p className="text-xs text-text-tertiary capitalize">
            {agent.role.replace("_", " ")} &middot; {conversation.channel} &middot;{" "}
            {new Date(conversation.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="space-y-3 max-w-3xl">
        {messages && messages.length > 0 ? (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex",
                m.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "rounded-xl px-4 py-3 max-w-[80%] text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-accent text-white"
                    : "bg-bg-secondary text-text-primary border border-border"
                )}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
                <p
                  className={cn(
                    "text-[11px] mt-1",
                    m.role === "user" ? "text-white/60" : "text-text-tertiary"
                  )}
                >
                  {new Date(m.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-bg-secondary/20 p-8 text-center">
            <p className="text-text-secondary text-sm">No messages in this conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
}
