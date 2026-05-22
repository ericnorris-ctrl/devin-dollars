"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, DollarSign, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent } from "@/lib/format";
import { calculateFundingScore } from "@/lib/scoring";
import { USE_CASE_BUCKETS, type FitRanking } from "@/lib/utils";
import { useToast } from "@/components/layout/toast-context";

const ACU_RATE = 2.25;
const PRIORITIES = ["Critical", "High", "Medium"] as const;
const FIT_RANKINGS: FitRanking[] = ["Strong Fit", "Good Fit", "Moderate Fit"];

type BU = { id: string; name: string };
type SelectedFit = { category: string; ranking: FitRanking };

export default function PitchPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [bus, setBus] = useState<BU[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [buId, setBuId] = useState("");
  const [sponsorName, setSponsorName] = useState("");
  const [sponsorEmail, setSponsorEmail] = useState("");
  const [description, setDescription] = useState("");
  const [jiraKey, setJiraKey] = useState("");
  const [approvedBudget, setApprovedBudget] = useState<number>(0);
  const [requestedAcus, setRequestedAcus] = useState<number>(0);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [priority, setPriority] = useState<"Critical" | "High" | "Medium">("High");
  const [selectedFits, setSelectedFits] = useState<SelectedFit[]>([]);

  useEffect(() => {
    fetch("/api/business-units").then((r) => r.json()).then(setBus);
  }, []);

  const absoluteSavings = approvedBudget - estimatedCost;
  const savingsPercent = approvedBudget > 0 ? absoluteSavings / approvedBudget : 0;
  const acuUsdEquivalent = requestedAcus * ACU_RATE;

  const score = calculateFundingScore({
    approvedBudgetUsd: approvedBudget,
    estimatedCostWithDevinUsd: estimatedCost,
    strategicPriority: priority,
    useCaseFitRankings: selectedFits.map((f) => f.ranking),
  });

  function toggleFit(category: string) {
    if (selectedFits.find((f) => f.category === category)) {
      setSelectedFits(selectedFits.filter((f) => f.category !== category));
    } else if (selectedFits.length < 3) {
      setSelectedFits([...selectedFits, { category, ranking: "Good Fit" }]);
    }
  }

  function setFitRanking(category: string, ranking: FitRanking) {
    setSelectedFits(selectedFits.map((f) => (f.category === category ? { ...f, ranking } : f)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    await fetch("/api/initiatives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, bu_id: buId, sponsor_name: sponsorName, sponsor_email: sponsorEmail,
        description, jira_project_key: jiraKey, approved_budget_usd: approvedBudget,
        requested_acus: requestedAcus, estimated_cost_with_devin_usd: estimatedCost,
        strategic_priority: priority,
        use_case_fits: selectedFits.map((f) => ({ category: f.category, ranking: f.ranking })),
      }),
    });

    toast("Initiative submitted for review");
    router.push("/decisions");
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-primary">
            <Lightbulb className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Pitch a New Initiative</h1>
            <p className="text-sm text-muted-foreground">Request Devin Dollars (ACUs) to fund your IT initiative</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-8">
        {/* Left column — form fields */}
        <div className="col-span-2 space-y-8">
          {/* Initiative Identity */}
          <Section title="Initiative Identity">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Initiative Name" required>
                <input value={name} onChange={(e) => setName(e.target.value)} required
                  className="input-field" placeholder="e.g. Java-to-Kotlin Migration" />
              </Field>
              <Field label="Business Unit" required>
                <select value={buId} onChange={(e) => setBuId(e.target.value)} required className="input-field">
                  <option value="">Select BU…</option>
                  {bus.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Field>
              <Field label="Sponsor Name" required>
                <input value={sponsorName} onChange={(e) => setSponsorName(e.target.value)} required
                  className="input-field" placeholder="Sarah Chen" />
              </Field>
              <Field label="Sponsor Email" required>
                <input type="email" value={sponsorEmail} onChange={(e) => setSponsorEmail(e.target.value)} required
                  className="input-field" placeholder="sarah.chen@acme.com" />
              </Field>
            </div>
            <Field label="Description" required>
              <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 500))} required
                className="input-field min-h-24 resize-none" placeholder="Brief description of the initiative…" />
              <p className="mt-1 text-xs text-muted-foreground">{description.length}/500</p>
            </Field>
            <Field label="Linked Jira/Rally Project Key" required>
              <input value={jiraKey} onChange={(e) => setJiraKey(e.target.value)} required
                className="input-field w-64" placeholder="PLAT-2026-Q3" />
            </Field>
          </Section>

          {/* Quantitative */}
          <Section title="Quantitative Inputs">
            <div className="grid grid-cols-3 gap-4">
              <Field label="Originally Approved Budget" required>
                <CurrencyInput value={approvedBudget} onChange={setApprovedBudget} />
              </Field>
              <Field label="Devin Dollars (ACUs) Requested" required>
                <input type="number" min={0} value={requestedAcus || ""} onChange={(e) => setRequestedAcus(parseInt(e.target.value) || 0)}
                  required className="input-field" placeholder="0" />
                <p className="mt-1 text-xs text-muted-foreground">
                  USD equivalent: {formatCurrency(acuUsdEquivalent)} @ ${ACU_RATE}/ACU
                </p>
              </Field>
              <Field label="Est. Total Cost with Devin" required>
                <CurrencyInput value={estimatedCost} onChange={setEstimatedCost} />
              </Field>
            </div>

            {/* Live savings display */}
            {approvedBudget > 0 && estimatedCost > 0 && (
              <div className="mt-4 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-emerald-600">Estimated Savings</p>
                    <p className="text-2xl font-bold text-emerald-700">{formatCurrency(absoluteSavings)}</p>
                  </div>
                  <div className="h-10 w-px bg-emerald-200" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-emerald-600">Savings Rate</p>
                    <p className="text-2xl font-bold text-emerald-700">{formatPercent(savingsPercent)}</p>
                  </div>
                </div>
              </div>
            )}
          </Section>

          {/* Use Case Fit */}
          <Section title="Use Case Fit for Devin" subtitle="Select up to 3 categories and rate the fit">
            <div className="grid grid-cols-2 gap-3">
              {USE_CASE_BUCKETS.map((bucket) => {
                const sel = selectedFits.find((f) => f.category === bucket.category);
                return (
                  <div
                    key={bucket.category}
                    onClick={() => toggleFit(bucket.category)}
                    className={cn(
                      "cursor-pointer rounded-xl border-2 p-4 transition-all",
                      sel ? "border-primary bg-blue-50/50" : "border-border hover:border-slate-300 bg-white",
                      !sel && selectedFits.length >= 3 && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <p className="text-sm font-semibold text-foreground">{bucket.category}</p>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {bucket.examples.join(" · ")}
                    </p>
                    {sel && (
                      <div className="mt-3 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {FIT_RANKINGS.map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setFitRanking(bucket.category, r)}
                            className={cn(
                              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                              sel.ranking === r
                                ? "bg-primary text-white"
                                : "bg-white border border-border text-muted-foreground hover:bg-slate-50"
                            )}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Strategic Priority */}
          <Section title="Strategic Priority">
            <div className="flex gap-3">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    "rounded-xl border-2 px-6 py-3 text-sm font-medium transition-all",
                    priority === p
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-white text-foreground hover:border-slate-300"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </Section>

          <button
            type="submit"
            disabled={submitting || !name || !buId || !sponsorName || !sponsorEmail || selectedFits.length === 0}
            className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white hover:bg-blue-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Submit Pitch <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Right column — live score */}
        <div className="col-span-1">
          <div className="sticky top-24">
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Devin Funding Score</p>
              </div>

              <div className="flex items-center justify-center mb-6">
                <div className={cn(
                  "flex h-24 w-24 items-center justify-center rounded-full border-4",
                  score.total >= 75 ? "border-emerald-400 text-emerald-700" :
                  score.total >= 50 ? "border-amber-400 text-amber-700" :
                  "border-slate-300 text-slate-500",
                  score.total >= 75 && "score-badge-high"
                )}>
                  <span className="text-3xl font-bold">{score.total}</span>
                </div>
              </div>

              <div className="space-y-3">
                <ScoreRow label="Savings %" value={score.savingsPercentageScore} max={40} />
                <ScoreRow label="Absolute Savings" value={score.absoluteSavingsScore} max={20} />
                <ScoreRow label="Strategic Priority" value={score.strategicPriorityScore} max={20} />
                <ScoreRow label="Use Case Fit" value={score.useCaseFitScore} max={20} />
              </div>

              <div className="mt-6 rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Score updates live as you fill the form. Higher scores indicate stronger ROI potential and better alignment with Devin capabilities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-6">
      <h2 className="text-base font-semibold mb-1">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </section>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block mb-4">
      <span className="text-sm font-medium text-foreground">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function CurrencyInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="relative">
      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        type="number"
        min={0}
        value={value || ""}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="input-field pl-9"
        placeholder="0"
      />
    </div>
  );
}

function ScoreRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value}/{max}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-primary progress-animated" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
