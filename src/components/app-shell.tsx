import { ReactNode } from "react";
import { MainNav } from "@/components/main-nav";
import { MissionBanner } from "@/components/mission-banner";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-10 pt-6 md:px-8">
      <header className="mb-6 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted">OpenClaw</p>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">Mission Control</h1>
          </div>
          <MainNav />
        </div>
        <MissionBanner />
      </header>
      <main>{children}</main>
    </div>
  );
}
