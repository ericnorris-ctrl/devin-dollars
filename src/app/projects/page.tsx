"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderOpen, ArrowRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/lib/format";

type Initiative = {
  id: string; name: string; bu_name: string; approved_budget_usd: number;
  requested_acus: number; estimated_cost_with_devin_usd: number;
  status: string; funding_score: number;
};

export default function ProjectsPage() {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  useEffect(() => {
    fetch("/api/initiatives").then((r) => r.json()).then(setInitiatives);
  }, []);

  const active = initiatives.filter((i) => i.status === "Approved" || i.status === "Completed");

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <FolderOpen className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Active Projects</h1>
          <p className="text-sm text-muted-foreground">Monitor approved initiatives and ACU consumption</p>
        </div>
      </div>

      {active.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-16 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No approved initiatives yet. Approve a pitch to see it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {active.map((init) => {
            const savings = init.approved_budget_usd - init.estimated_cost_with_devin_usd;
            return (
              <Link key={init.id} href={`/projects/${init.id}`} className="card-hover block rounded-2xl border border-border bg-white p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold">{init.name}</h3>
                    <p className="text-xs text-muted-foreground">{init.bu_name}</p>
                  </div>
                  <span className={cn(
                    "rounded-md px-2 py-0.5 text-xs font-medium",
                    init.status === "Completed" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                  )}>
                    {init.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Budget</p>
                    <p className="font-semibold tabular-nums">{formatCurrency(init.approved_budget_usd)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ACUs</p>
                    <p className="font-semibold tabular-nums">{formatNumber(init.requested_acus)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Proj. Savings</p>
                    <p className="font-semibold tabular-nums text-emerald-600">{formatCurrency(savings)}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center text-xs text-primary font-medium">
                  View Details <ArrowRight className="ml-1 h-3 w-3" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
