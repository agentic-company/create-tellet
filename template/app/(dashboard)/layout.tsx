import { Sidebar } from "@/components/dashboard/Sidebar";
import { OrchestratorChat } from "@/components/dashboard/OrchestratorChat";
import config from "../../tellet.json";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar companyName={config.company.name} />
      <main className="flex-1 overflow-y-auto bg-bg-primary">
        <div className="p-8">{children}</div>
      </main>
      <OrchestratorChat />
    </div>
  );
}
