import { getPostVote, getReplyVote, setPostVote, setReplyVote } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in to vote." }, { status: 401 });
  if (user.welcome_read_at === null) {
    return Response.json({ error: "Complete the welcome step before voting." }, { status: 403 });
  }

  let payload: Record<string, unknown>;
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json({ error: "Invalid vote request." }, { status: 400 });
    }
    payload = body as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid vote request." }, { status: 400 });
  }

  const postId =
    typeof payload.postId === "number" && Number.isSafeInteger(payload.postId) && payload.postId > 0
      ? payload.postId
      : null;
  const replyId =
    typeof payload.replyId === "number" && Number.isSafeInteger(payload.replyId) && payload.replyId > 0
      ? payload.replyId
      : null;
  const voteValue = payload.voteValue;
  if (
    (postId === null) === (replyId === null) ||
    (voteValue !== -1 && voteValue !== 0 && voteValue !== 1)
  ) {
    return Response.json({ error: "Invalid vote request." }, { status: 400 });
  }

  if (postId !== null) {
    await setPostVote(postId, user.id, voteValue);
    return Response.json(await getPostVote(postId, user.id));
  }

  if (replyId === null) {
    return Response.json({ error: "Invalid vote request." }, { status: 400 });
  }
  await setReplyVote(replyId, user.id, voteValue);
  return Response.json(await getReplyVote(replyId, user.id));
}
