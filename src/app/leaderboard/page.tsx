"use client";

import { useEffect, useState } from "react";
import { BarChart3, AlertTriangle, Bell, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber, formatPercent } from "@/lib/format";
import { useToast } from "@/components/layout/toast-context";

type LeaderboardRow = {
  rank: number; buId: string; buName: string; leadName: string;
  untaggedAcus: number; totalAcus: number; untaggedPercent: number;
  priorUntaggedAcus: number; topUsers: { email: string; acus: number }[];
};

const PERIODS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "QTD", days: 90 },
] as const;

export default function LeaderboardPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    fetch(`/api/sessions?days=${period}`).then((r) => r.json()).then(setRows);
  }, [period]);

  const worst = rows[0];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Untagged Usage Leaderboard</h1>
          <p className="text-sm text-muted-foreground">Identify BUs with Devin sessions not linked to tickets</p>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-muted-foreground mr-1">Period:</span>
        {PERIODS.map((p) => (
          <button
            key={p.label}
            onClick={() => setPeriod(p.days)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              period === p.days ? "bg-primary text-white" : "bg-white border border-border text-muted-foreground hover:bg-slate-50"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Worst offender callout */}
      {worst && worst.untaggedAcus > 0 && (
        <div className="mb-6 rounded-2xl border-2 border-amber-200 bg-amber-50 p-5 flex items-start gap-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Needs Attention: {worst.buName}</p>
            <p className="text-sm text-amber-700 mt-1">
              {formatNumber(worst.untaggedAcus)} untagged ACUs ({formatPercent(worst.untaggedPercent)} of total usage) in the last {period} days.
              Encouraging ticket tagging helps track ROI and ensures accurate project attribution.
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-slate-50/50">
              <th className="px-6 py-3 text-center font-medium text-muted-foreground w-16">Rank</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Business Unit</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Untagged ACUs</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">% of Total</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Trend</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Top Untagged Users</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground w-28" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const trendDelta = row.untaggedAcus - row.priorUntaggedAcus;
              return (
                <tr key={row.buId} className={cn("border-b border-border last:border-0 hover:bg-slate-50/50 transition-colors", row.rank === 1 && row.untaggedAcus > 0 && "bg-amber-50/30")}>
                  <td className="px-6 py-3 text-center">
                    <span className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                      row.rank === 1 && row.untaggedAcus > 0 ? "bg-amber-100 text-amber-700" :
                      row.rank <= 3 ? "bg-slate-100 text-slate-600" : "text-muted-foreground"
                    )}>
                      {row.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{row.buName}</p>
                    <p className="text-xs text-muted-foreground">{row.leadName}</p>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">{formatNumber(row.untaggedAcus)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.min(100, row.untaggedPercent * 100)}%` }} />
                      </div>
                      <span className="tabular-nums text-muted-foreground w-12 text-right">{formatPercent(row.untaggedPercent)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <TrendIndicator delta={trendDelta} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {row.topUsers.map((u) => (
                        <span key={u.email} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-muted-foreground">
                          {u.email.split("@")[0]}
                        </span>
                      ))}
                      {row.topUsers.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toast(`Nudge sent to ${row.leadName}`)}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Bell className="h-3 w-3" /> Nudge
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TrendIndicator({ delta }: { delta: number }) {
  if (delta > 100) return <span className="inline-flex items-center gap-0.5 text-xs text-red-600 font-medium"><TrendingUp className="h-3 w-3" /> Worse</span>;
  if (delta < -100) return <span className="inline-flex items-center gap-0.5 text-xs text-emerald-600 font-medium"><TrendingDown className="h-3 w-3" /> Better</span>;
  return <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground"><Minus className="h-3 w-3" /> Flat</span>;
}
