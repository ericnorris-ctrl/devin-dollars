"use client";

import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { format, parseISO, eachWeekOfInterval } from "date-fns";

type Session = { acus_consumed: number; started_at: string };

function buildChartData(sessions: Session[], totalAcus: number, approvedAt: string, plannedEndDate: string) {
  const start = parseISO(approvedAt);
  const end = parseISO(plannedEndDate);
  const weeks = eachWeekOfInterval({ start, end });
  const sorted = [...sessions].sort((a, b) => a.started_at.localeCompare(b.started_at));

  const data: { week: string; actual: number; expected: number }[] = [];
  let cumulative = 0;
  let sessionIdx = 0;

  for (let i = 0; i < weeks.length; i++) {
    const weekEnd = weeks[i + 1] ?? end;
    while (sessionIdx < sorted.length && parseISO(sorted[sessionIdx].started_at) < weekEnd) {
      cumulative += sorted[sessionIdx].acus_consumed;
      sessionIdx++;
    }
    data.push({
      week: format(weeks[i], "MMM d"),
      actual: cumulative,
      expected: Math.round(totalAcus * ((i + 1) / weeks.length)),
    });
  }

  return data;
}

export function BurnChart({
  sessions, totalAcus, approvedAt, plannedEndDate,
}: {
  sessions: Session[]; totalAcus: number; approvedAt: string; plannedEndDate: string;
}) {
  const chartData = useMemo(
    () => buildChartData(sessions, totalAcus, approvedAt, plannedEndDate),
    [sessions, totalAcus, approvedAt, plannedEndDate]
  );

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
            formatter={(value, name) => [Number(value).toLocaleString() + " ACUs", name === "actual" ? "Actual Burn" : "Expected Burn"]}
          />
          <ReferenceLine y={totalAcus} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Budget", fill: "#ef4444", fontSize: 11 }} />
          <Line type="monotone" dataKey="expected" stroke="#94a3b8" strokeWidth={2} strokeDasharray="6 3" dot={false} />
          <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#3b82f6" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
