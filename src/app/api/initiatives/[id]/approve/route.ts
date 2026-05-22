import { updateInitiativeStatus } from "@/lib/queries";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  updateInitiativeStatus(id, "Approved");
  return Response.json({ success: true });
}
