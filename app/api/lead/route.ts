import { handleLeadSubmission } from "@/lib/leadWebhook";

export async function POST(request: Request) {
  return handleLeadSubmission(request, "dashboard-gate");
}
