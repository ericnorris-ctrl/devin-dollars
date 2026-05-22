import { getLeaderboardData } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get("days") ?? "30", 10);
  return Response.json(getLeaderboardData(days));
}
