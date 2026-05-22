import { getAllInitiatives, getUseCaseFits, createInitiative } from "@/lib/queries";
import { calculateFundingScore } from "@/lib/scoring";
import type { FitRanking } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const initiatives = getAllInitiatives();
  const withFits = initiatives.map((init) => ({
    ...init,
    useCaseFits: getUseCaseFits(init.id),
  }));
  return Response.json(withFits);
}

export async function POST(request: Request) {
  const body = await request.json();

  const score = calculateFundingScore({
    approvedBudgetUsd: body.approved_budget_usd,
    estimatedCostWithDevinUsd: body.estimated_cost_with_devin_usd,
    strategicPriority: body.strategic_priority,
    useCaseFitRankings: body.use_case_fits.map((f: { ranking: string }) => f.ranking as FitRanking),
  });

  createInitiative({
    id: crypto.randomUUID(),
    name: body.name,
    bu_id: body.bu_id,
    sponsor_name: body.sponsor_name,
    sponsor_email: body.sponsor_email,
    description: body.description,
    jira_project_key: body.jira_project_key,
    approved_budget_usd: body.approved_budget_usd,
    requested_acus: body.requested_acus,
    estimated_cost_with_devin_usd: body.estimated_cost_with_devin_usd,
    strategic_priority: body.strategic_priority,
    funding_score: score.total,
    use_case_fits: body.use_case_fits,
  });

  return Response.json({ success: true, score });
}
