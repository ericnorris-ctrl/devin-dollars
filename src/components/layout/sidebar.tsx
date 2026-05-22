"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lightbulb, Scale, FolderOpen, BarChart3, Hexagon } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePersona } from "./persona-context";

const NAV_ITEMS = [
  { href: "/pitch", label: "Pitch Initiative", icon: Lightbulb, personas: ["IT Leader", "BU Admin"] },
  { href: "/decisions", label: "Funding Decisions", icon: Scale, personas: ["Finance Approver", "IT Leader"] },
  { href: "/projects", label: "Active Projects", icon: FolderOpen, personas: ["IT Leader", "Finance Approver", "BU Admin"] },
  { href: "/leaderboard", label: "Usage Leaderboard", icon: BarChart3, personas: ["Finance Approver", "BU Admin"] },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { persona } = usePersona();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-60 flex-col bg-sidebar-bg text-sidebar-fg">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-active">
          <Hexagon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-white tracking-tight">Devin Dollars</h1>
          <p className="text-xs text-slate-400">ACU Project Tracker</p>
        </div>
      </div>

      <nav className="mt-2 flex-1 px-3">
        <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-slate-500">Navigation</p>
        {NAV_ITEMS.map(({ href, label, icon: Icon, personas }) => {
          const active = pathname.startsWith(href);
          const emphasized = personas.includes(persona);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-sidebar-active/15 text-white font-medium"
                  : "hover:bg-white/5 text-slate-400 hover:text-slate-200",
                !emphasized && "opacity-50"
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-sidebar-active" : "text-slate-500 group-hover:text-slate-400")} />
              {label}
              {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-active" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-6 py-4">
        <p className="text-xs text-slate-500">Demo Environment</p>
        <p className="text-xs text-slate-400 mt-0.5">Seeded data · No auth</p>
      </div>
    </aside>
  );
}
