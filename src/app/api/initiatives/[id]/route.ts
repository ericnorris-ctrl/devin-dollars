import { getInitiative, getUseCaseFits, getSessionsForInitiative, getTicketsForInitiative } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const initiative = getInitiative(id);
  if (!initiative) return Response.json({ error: "Not found" }, { status: 404 });

  const useCaseFits = getUseCaseFits(id);
  const sessions = getSessionsForInitiative(id);
  const tickets = getTicketsForInitiative(id);
  const consumedAcus = sessions.reduce((sum, s) => sum + s.acus_consumed, 0);

  return Response.json({ ...initiative, useCaseFits, sessions, tickets, consumedAcus });
}
