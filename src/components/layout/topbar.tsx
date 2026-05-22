"use client";

import { useEffect, useState } from "react";
import { User, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { usePersona } from "./persona-context";
import type { Persona } from "@/lib/utils";

const PERSONAS: Persona[] = ["IT Leader", "Finance Approver", "BU Admin"];
const PERSONA_COLORS: Record<Persona, string> = {
  "IT Leader": "bg-blue-500",
  "Finance Approver": "bg-emerald-500",
  "BU Admin": "bg-amber-500",
};

type KPIs = {
  totalAllocatedAcus: number;
  totalConsumedAcus: number;
  totalProjectedSavings: number;
  taggedPercent: number;
};

export function Topbar() {
  const { persona, setPersona } = usePersona();
  const [open, setOpen] = useState(false);
  const [kpis, setKpis] = useState<KPIs | null>(null);

  useEffect(() => {
    fetch("/api/kpis").then((r) => r.json()).then(setKpis);
  }, []);

  return (
    <header className="fixed left-60 right-0 top-0 z-30 border-b border-border bg-white/80 backdrop-blur-sm">
      {/* KPI Strip */}
      <div className="bg-kpi-strip text-white px-8 py-2.5 flex items-center gap-8">
        <KPIChip label="ACUs Allocated" value={kpis ? formatNumber(kpis.totalAllocatedAcus) : "—"} />
        <div className="h-4 w-px bg-white/20" />
        <KPIChip label="ACUs Consumed" value={kpis ? formatNumber(kpis.totalConsumedAcus) : "—"} />
        <div className="h-4 w-px bg-white/20" />
        <KPIChip label="Projected Savings" value={kpis ? formatCurrency(kpis.totalProjectedSavings) : "—"} accent />
        <div className="h-4 w-px bg-white/20" />
        <KPIChip label="Sessions Tagged" value={kpis ? formatPercent(kpis.taggedPercent) : "—"} />

        <div className="ml-auto relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20 transition-colors"
          >
            <div className={cn("h-2 w-2 rounded-full", PERSONA_COLORS[persona])} />
            <User className="h-3.5 w-3.5" />
            <span className="text-sm font-medium">{persona}</span>
            <ChevronDown className="h-3 w-3" />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-white/10 bg-slate-800 py-1 shadow-xl">
              {PERSONAS.map((p) => (
                <button
                  key={p}
                  onClick={() => { setPersona(p); setOpen(false); }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-white/10 transition-colors",
                    p === persona && "bg-white/5 font-medium text-white"
                  )}
                >
                  <div className={cn("h-2 w-2 rounded-full", PERSONA_COLORS[p])} />
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function KPIChip({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
      <span className={cn("text-sm font-semibold tabular-nums", accent && "text-emerald-400")}>
        {value}
      </span>
    </div>
  );
}
