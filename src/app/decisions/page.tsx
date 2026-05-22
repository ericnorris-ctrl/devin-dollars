"use client";

import { useEffect, useState } from "react";
import { Scale, ChevronDown, ChevronRight, Check, X, MessageSquare, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/format";

type UseCaseFit = { category: string; ranking: string };
type Initiative = {
  id: string; name: string; bu_name: string; sponsor_name: string; sponsor_email: string;
  description: string; jira_project_key: string; approved_budget_usd: number;
  requested_acus: number; estimated_cost_with_devin_usd: number;
  strategic_priority: string; status: string; funding_score: number;
  created_at: string; useCaseFits: UseCaseFit[];
};

type Filter = "all" | "Pending Review" | "Approved" | "Completed" | "Rejected";

export default function DecisionsPage() {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<"funding_score" | "approved_budget_usd" | "name">("funding_score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const load = () => fetch("/api/initiatives").then((r) => r.json()).then(setInitiatives);
  useEffect(() => { load(); }, []);

  const filtered = initiatives
    .filter((i) => filter === "all" || i.status === filter)
    .sort((a, b) => {
      const m = sortDir === "asc" ? 1 : -1;
      if (sortField === "name") return a.name.localeCompare(b.name) * m;
      return ((a[sortField] as number) - (b[sortField] as number)) * m;
    });

  function toggleSort(field: typeof sortField) {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  }

  async function handleAction(id: string, action: "approve" | "reject") {
    await fetch(`/api/initiatives/${id}/${action}`, { method: "POST" });
    load();
    setExpandedId(null);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Scale className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Funding Decisions</h1>
          <p className="text-sm text-muted-foreground">Review and approve initiative pitches</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(["all", "Pending Review", "Approved", "Completed", "Rejected"] as const).map((f) => {
          const count = f === "all" ? initiatives.length : initiatives.filter((i) => i.status === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === f ? "bg-primary text-white" : "bg-white border border-border text-muted-foreground hover:bg-slate-50"
              )}
            >
              {f === "all" ? "All" : f} <span className="ml-1 opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="rounded-2xl border border-border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-8" />
                <SortHeader label="Initiative" field="name" current={sortField} dir={sortDir} onSort={toggleSort} />
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">BU</th>
                <SortHeader label="Budget" field="approved_budget_usd" current={sortField} dir={sortDir} onSort={toggleSort} />
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">ACUs</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Savings</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Priority</th>
                <SortHeader label="Score" field="funding_score" current={sortField} dir={sortDir} onSort={toggleSort} align="center" />
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((init) => {
                const expanded = expandedId === init.id;
                const savings = init.approved_budget_usd - init.estimated_cost_with_devin_usd;
                const savingsPct = init.approved_budget_usd > 0 ? savings / init.approved_budget_usd : 0;

                return (
                  <TableRow
                    key={init.id}
                    init={init}
                    expanded={expanded}
                    savings={savings}
                    savingsPct={savingsPct}
                    onToggle={() => setExpandedId(expanded ? null : init.id)}
                    onAction={handleAction}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TableRow({ init, expanded, savings, savingsPct, onToggle, onAction }: {
  init: Initiative; expanded: boolean; savings: number; savingsPct: number;
  onToggle: () => void; onAction: (id: string, action: "approve" | "reject") => void;
}) {
  return (
    <>
      <tr className={cn("border-b border-border hover:bg-slate-50/50 transition-colors cursor-pointer", expanded && "bg-blue-50/30")} onClick={onToggle}>
        <td className="px-4 py-3">
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </td>
        <td className="px-4 py-3 font-medium">{init.name}</td>
        <td className="px-4 py-3 text-muted-foreground">{init.bu_name}</td>
        <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(init.approved_budget_usd)}</td>
        <td className="px-4 py-3 text-right tabular-nums">{formatNumber(init.requested_acus)}</td>
        <td className="px-4 py-3 text-right">
          <span className="tabular-nums">{formatCurrency(savings)}</span>
          <span className="ml-1 text-xs text-emerald-600">({formatPercent(savingsPct)})</span>
        </td>
        <td className="px-4 py-3 text-center">
          <PriorityBadge priority={init.strategic_priority} />
        </td>
        <td className="px-4 py-3 text-center">
          <ScoreBadge score={init.funding_score} />
        </td>
        <td className="px-4 py-3 text-center">
          <StatusBadge status={init.status} />
        </td>
        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
          {init.status === "Pending Review" && (
            <div className="flex items-center justify-end gap-1">
              <button onClick={() => onAction(init.id, "approve")} className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600 hover:bg-emerald-100 transition-colors" title="Approve">
                <Check className="h-4 w-4" />
              </button>
              <button onClick={() => onAction(init.id, "reject")} className="rounded-lg bg-red-50 p-1.5 text-red-600 hover:bg-red-100 transition-colors" title="Reject">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-blue-50/20">
          <td colSpan={10} className="px-8 py-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2">
                <p className="text-sm font-medium mb-1">Description</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{init.description}</p>
                <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
                  <span>Sponsor: {init.sponsor_name} ({init.sponsor_email})</span>
                  <span>Project: {init.jira_project_key}</span>
                </div>
                {init.useCaseFits.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Use Case Fit</p>
                    <div className="flex gap-2">
                      {init.useCaseFits.map((f) => (
                        <span key={f.category} className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-primary">
                          {f.category} — {f.ranking}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium mb-3">Score Breakdown</p>
                <ScoreBreakdownDisplay score={init.funding_score} />
              </div>
            </div>
            {init.status === "Pending Review" && (
              <div className="mt-6 flex gap-3 border-t border-border pt-4">
                <button onClick={() => onAction(init.id, "approve")} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors">
                  <Check className="h-4 w-4" /> Approve
                </button>
                <button onClick={() => onAction(init.id, "reject")} className="flex items-center gap-1.5 rounded-xl bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors">
                  <X className="h-4 w-4" /> Reject
                </button>
                <button className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-5 py-2 text-sm font-medium text-foreground hover:bg-slate-50 transition-colors">
                  <MessageSquare className="h-4 w-4" /> Request More Info
                </button>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function ScoreBreakdownDisplay({ score }: { score: number }) {
  return (
    <div className="rounded-xl bg-white border border-border p-4">
      <div className="flex items-center justify-center mb-3">
        <ScoreBadge score={score} large />
      </div>
      <p className="text-xs text-center text-muted-foreground">Composite score out of 100</p>
    </div>
  );
}

function SortHeader({ label, field, current, dir, onSort, align }: {
  label: string; field: string; current: string; dir: string;
  onSort: (f: "funding_score" | "approved_budget_usd" | "name") => void;
  align?: "center";
}) {
  return (
    <th
      className={cn("px-4 py-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none", align === "center" ? "text-center" : "text-left")}
      onClick={() => onSort(field as "funding_score" | "approved_budget_usd" | "name")}
    >
      {label}
      {current === field && <span className="ml-1 text-xs">{dir === "asc" ? "↑" : "↓"}</span>}
    </th>
  );
}

function ScoreBadge({ score, large }: { score: number; large?: boolean }) {
  const color = score >= 75 ? "bg-emerald-100 text-emerald-700" : score >= 50 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600";
  return (
    <span className={cn("inline-flex items-center justify-center rounded-full font-bold tabular-nums", color, large ? "h-12 w-12 text-lg" : "h-8 w-8 text-xs")}>
      {score}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    Critical: "bg-red-100 text-red-700",
    High: "bg-amber-100 text-amber-700",
    Medium: "bg-slate-100 text-slate-600",
  };
  return <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", styles[priority] ?? "bg-slate-100")}>{priority}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "Pending Review": "bg-amber-100 text-amber-700",
    Approved: "bg-emerald-100 text-emerald-700",
    Completed: "bg-blue-100 text-blue-700",
    Rejected: "bg-red-100 text-red-700",
  };
  return <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap", styles[status] ?? "bg-slate-100")}>{status}</span>;
}

function EmptyState({ filter }: { filter: Filter }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-white p-16 text-center">
      <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
      <p className="text-sm text-muted-foreground">
        {filter === "Pending Review"
          ? "No pitches awaiting review. New pitches will appear here when submitted."
          : `No initiatives with status "${filter === "all" ? "any" : filter}".`}
      </p>
    </div>
  );
}
