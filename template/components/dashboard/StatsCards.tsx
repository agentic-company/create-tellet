interface StatsCardsProps {
  totalConversations: number;
  totalMessages: number;
  activeAgents: number;
  estimatedCost: number;
}

const cards = [
  { key: "conversations", label: "Conversations", color: "text-blue-400" },
  { key: "messages", label: "Messages", color: "text-green-400" },
  { key: "agents", label: "Active Agents", color: "text-purple-400" },
  { key: "cost", label: "Est. Cost", color: "text-amber-400" },
] as const;

export function StatsCards({ totalConversations, totalMessages, activeAgents, estimatedCost }: StatsCardsProps) {
  const values: Record<string, string> = {
    conversations: String(totalConversations),
    messages: String(totalMessages),
    agents: String(activeAgents),
    cost: `$${estimatedCost.toFixed(2)}`,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => (
        <div
          key={card.key}
          className="rounded-xl border border-border bg-bg-secondary/50 p-5"
        >
          <p className="text-xs text-text-tertiary uppercase tracking-wider mb-2">
            {card.label}
          </p>
          <p className={`text-2xl font-semibold ${card.color}`}>
            {values[card.key]}
          </p>
        </div>
      ))}
    </div>
  );
}
