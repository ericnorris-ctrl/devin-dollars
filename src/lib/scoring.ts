export interface ScoreBreakdown {
  savingsPercentageScore: number;
  absoluteSavingsScore: number;
  strategicPriorityScore: number;
  useCaseFitScore: number;
  total: number;
}

export function calculateFundingScore(input: {
  approvedBudgetUsd: number;
  estimatedCostWithDevinUsd: number;
  strategicPriority: "Critical" | "High" | "Medium";
  useCaseFitRankings: ("Strong Fit" | "Good Fit" | "Moderate Fit")[];
}): ScoreBreakdown {
  const absoluteSavings = input.approvedBudgetUsd - input.estimatedCostWithDevinUsd;
  const savingsPercent =
    input.approvedBudgetUsd > 0 ? absoluteSavings / input.approvedBudgetUsd : 0;

  // Savings percentage: 0-40 pts (linear, capped at 40 for ≥50%)
  const savingsPercentageScore = Math.min(40, Math.max(0, (savingsPercent / 0.5) * 40));

  // Absolute savings: 0-20 pts (linear, capped at 20 for ≥$500k)
  const absoluteSavingsScore = Math.min(20, Math.max(0, (absoluteSavings / 500000) * 20));

  // Strategic priority
  const priorityMap: Record<string, number> = { Critical: 20, High: 12, Medium: 6 };
  const strategicPriorityScore = priorityMap[input.strategicPriority] ?? 0;

  // Use case fit (best-ranked selection)
  const fitMap: Record<string, number> = { "Strong Fit": 20, "Good Fit": 12, "Moderate Fit": 6 };
  const useCaseFitScore = Math.max(0, ...input.useCaseFitRankings.map((r) => fitMap[r] ?? 0));

  const total = Math.round(
    savingsPercentageScore + absoluteSavingsScore + strategicPriorityScore + useCaseFitScore
  );

  return {
    savingsPercentageScore: Math.round(savingsPercentageScore * 10) / 10,
    absoluteSavingsScore: Math.round(absoluteSavingsScore * 10) / 10,
    strategicPriorityScore,
    useCaseFitScore,
    total,
  };
}
