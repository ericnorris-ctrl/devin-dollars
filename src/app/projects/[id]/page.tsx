"use client";

import { useEffect, useState, useMemo, use } from "react";
import Link from "next/link";
import { ArrowLeft, Zap, DollarSign, Target, TrendingUp, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { BurnChart } from "@/components/charts/burn-chart";

const ACU_RATE = 2.25;

type Session = {
  id: string; ticket_key: string | null; user_email: string;
  acus_consumed: number; started_at: string; outcome: string;
};
type Ticket = { key: string; title: string; status: string; source: string };
type UseCaseFit = { category: string; ranking: string };
type ProjectData = {
  id: string; name: string; bu_name: string; approved_budget_usd: number;
  requested_acus: number; estimated_cost_with_devin_usd: number;
  strategic_priority: string; status: string; planned_end_date: string | null;
  approved_at: string | null; consumedAcus: number;
  sessions: Session[]; tickets: Ticket[]; useCaseFits: UseCaseFit[];
};

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<ProjectData | null>(null);

  useEffect(() => {
    fetch(`/api/initiatives/${id}`).then((r) => r.json()).then(setData);
  }, [id]);

  const fallbackEndDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 180);
    return d.toISOString();
  }, []);

  if (!data) return <LoadingSkeleton />;

  const remaining = data.requested_acus - data.consumedAcus;
  const consumedPct = data.requested_acus > 0 ? data.consumedAcus / data.requested_acus : 0;

  // Pacing calculation
  const now = new Date();
  const approvedAt = data.approved_at ? new Date(data.approved_at) : now;
  const endDate = data.planned_end_date ? new Date(data.planned_end_date) : new Date(now.getTime() + 180 * 86400000);
  const totalDuration = endDate.getTime() - approvedAt.getTime();
  const elapsed = now.getTime() - approvedAt.getTime();
  const expectedPct = totalDuration > 0 ? Math.min(1, elapsed / totalDuration) : 0;
  const paceStatus: "green" | "amber" | "red" =
    consumedPct > 1 ? "red" : consumedPct > expectedPct * 1.15 ? "amber" : "green";

  const onTrackSpend = data.consumedAcus * ACU_RATE;
  const projectedSavings = data.approved_budget_usd - onTrackSpend;
  const reinvestmentPool = projectedSavings * 0.5;

  // Build session-ticket map for linked tickets table
  const sessionsByTicket = new Map<string, { acus: number; lastStart: string; outcome: string; sessionId: string }>();
  for (const s of data.sessions) {
    if (!s.ticket_key) continue;
    const existing = sessionsByTicket.get(s.ticket_key);
    if (existing) {
      existing.acus += s.acus_consumed;
      if (s.started_at > existing.lastStart) {
        existing.lastStart = s.started_at;
        existing.outcome = s.outcome;
        existing.sessionId = s.id;
      }
    } else {
      sessionsByTicket.set(s.ticket_key, {
        acus: s.acus_consumed,
        lastStart: s.started_at,
        outcome: s.outcome,
        sessionId: s.id,
      });
    }
  }

  const ticketRows = data.tickets.map((t) => ({
    ...t,
    ...(sessionsByTicket.get(t.key) ?? { acus: 0, lastStart: "", outcome: "—", sessionId: "" }),
  }));

  return (
    <div>
      <Link href="/projects" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Projects
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{data.name}</h1>
        <p className="text-sm text-muted-foreground">{data.bu_name} · {data.status}</p>
      </div>

      {/* Three headline cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {/* ACU Consumption */}
        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">ACU Consumption</h3>
          </div>
          <div className="flex items-end gap-4 mb-3">
            <div>
              <p className="text-xs text-muted-foreground">Consumed</p>
              <p className="text-xl font-bold tabular-nums">{formatNumber(data.consumedAcus)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Approved</p>
              <p className="text-lg font-semibold tabular-nums text-muted-foreground">{formatNumber(data.requested_acus)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className={cn("text-lg font-semibold tabular-nums", remaining < 0 ? "text-destructive" : "text-emerald-600")}>
                {formatNumber(remaining)}
              </p>
            </div>
          </div>
          <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full progress-animated transition-all",
                paceStatus === "green" ? "bg-emerald-500" : paceStatus === "amber" ? "bg-amber-500" : "bg-red-500"
              )}
              style={{ width: `${Math.min(100, consumedPct * 100)}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>{formatPercent(consumedPct)} consumed</span>
            <span className={cn(
              "font-medium",
              paceStatus === "green" ? "text-emerald-600" : paceStatus === "amber" ? "text-amber-600" : "text-red-600"
            )}>
              {paceStatus === "green" ? "On Pace" : paceStatus === "amber" ? "Slightly Over Pace" : "Over Budget"}
            </span>
          </div>
        </div>

        {/* Initiative Financials */}
        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-semibold">Initiative Financials</h3>
          </div>
          <div className="space-y-3">
            <FinancialRow label="Originally Approved" value={formatCurrency(data.approved_budget_usd)} />
            <FinancialRow label="On Track to Spend" value={formatCurrency(onTrackSpend)} muted />
            <FinancialRow label="Projected Savings" value={formatCurrency(projectedSavings)} accent />
          </div>
          {/* BU Reinvestment Pool */}
          <div className="mt-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="h-4 w-4 text-emerald-600" />
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">BU Reinvestment Pool</p>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{formatCurrency(reinvestmentPool)}</p>
            <p className="text-xs text-emerald-600 mt-1">Your BU receives 50% of projected savings to allocate to another initiative.</p>
          </div>
        </div>

        {/* Use Case & Priority */}
        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-4 w-4 text-violet-600" />
            <h3 className="text-sm font-semibold">Use Case & Priority</h3>
          </div>
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Strategic Priority</p>
            <span className={cn(
              "inline-block rounded-lg px-3 py-1 text-sm font-medium",
              data.strategic_priority === "Critical" ? "bg-red-100 text-red-700" :
              data.strategic_priority === "High" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
            )}>
              {data.strategic_priority}
            </span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Use Case Fit</p>
            <div className="space-y-2">
              {data.useCaseFits.map((f) => (
                <div key={f.category} className="rounded-lg bg-blue-50 px-3 py-2">
                  <p className="text-xs font-medium text-primary">{f.category}</p>
                  <p className="text-xs text-blue-500">{f.ranking}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Burn Chart */}
      <div className="rounded-2xl border border-border bg-white p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">ACU Burn Chart</h3>
        </div>
        <BurnChart
          sessions={data.sessions}
          totalAcus={data.requested_acus}
          approvedAt={data.approved_at ?? new Date().toISOString()}
          plannedEndDate={data.planned_end_date ?? fallbackEndDate}
        />
      </div>

      {/* Linked Tickets Table */}
      <div className="rounded-2xl border border-border bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-semibold">Linked Tickets</h3>
          <p className="text-xs text-muted-foreground">{ticketRows.length} tickets linked via {data.sessions.filter((s) => s.ticket_key).length} Devin sessions</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-slate-50/50">
              <th className="px-6 py-2.5 text-left font-medium text-muted-foreground">Ticket</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Title</th>
              <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">ACUs</th>
              <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Outcome</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Session</th>
            </tr>
          </thead>
          <tbody>
            {ticketRows.map((t) => (
              <tr key={t.key} className="border-b border-border last:border-0 hover:bg-slate-50/50">
                <td className="px-6 py-2.5">
                  <span className="text-primary font-medium cursor-pointer hover:underline">{t.key}</span>
                  <span className="ml-1 text-xs text-muted-foreground uppercase">{t.source}</span>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{t.title}</td>
                <td className="px-4 py-2.5 text-center">
                  <span className={cn(
                    "rounded-md px-2 py-0.5 text-xs font-medium",
                    t.status === "Done" ? "bg-emerald-100 text-emerald-700" :
                    t.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                    t.status === "In Review" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                  )}>
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">{formatNumber(t.acus)}</td>
                <td className="px-4 py-2.5 text-center">
                  <span className={cn(
                    "text-xs font-medium",
                    t.outcome === "Merged" ? "text-emerald-600" : t.outcome === "In Review" ? "text-amber-600" : t.outcome === "Abandoned" ? "text-red-500" : "text-muted-foreground"
                  )}>
                    {t.outcome}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  {t.sessionId && <span className="text-primary cursor-pointer hover:underline text-xs font-mono">{t.sessionId.slice(0, 8)}…</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FinancialRow({ label, value, accent, muted }: { label: string; value: string; accent?: boolean; muted?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-semibold tabular-nums", accent && "text-emerald-600", muted && "text-muted-foreground")}>
        {value}
      </span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-64 rounded bg-slate-200" />
      <div className="h-4 w-32 rounded bg-slate-100" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-48 rounded-2xl bg-slate-100" />)}
      </div>
    </div>
  );
}
