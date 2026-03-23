"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Dashboard", href: "/dashboard", icon: "H" },
  { label: "Agents", href: "/agents", icon: "A" },
  { label: "Conversations", href: "/conversations", icon: "C" },
  { label: "Settings", href: "/settings", icon: "S" },
];

export function Sidebar({ companyName }: { companyName: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r border-border bg-bg-primary flex flex-col h-full">
      <Link href="/" className="block p-5 hover:bg-bg-secondary/50 transition-colors">
        <span className="text-lg font-bold tracking-tight">{companyName}</span>
        <p className="text-[11px] text-text-tertiary mt-0.5">Powered by tellet</p>
      </Link>
      <nav className="flex-1 px-3 space-y-0.5">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname === item.href
                ? "bg-accent/10 text-accent"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
            )}
          >
            <span className="w-5 h-5 rounded bg-bg-tertiary flex items-center justify-center text-[10px] font-bold">
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
