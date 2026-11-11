import { listMembers } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json(
      { error: "Sign in to view the people list." },
      { status: 401, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  if (user.welcome_read_at === null) {
    return Response.json(
      { error: "Read the welcome thread before entering the room." },
      { status: 403, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const members = await listMembers();
  return Response.json(members, { headers: { "Cache-Control": "private, no-store" } });
}
