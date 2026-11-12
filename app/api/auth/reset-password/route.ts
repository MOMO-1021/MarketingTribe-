import { createHash } from "crypto";
import { hash } from "bcryptjs";
import {
  consumePasswordResetToken,
  isPasswordResetTokenValid,
} from "@/lib/db";
import { isSameOriginRequest } from "@/lib/password-reset-request";

export const runtime = "nodejs";

function logFailure(error: unknown) {
  const details =
    error && typeof error === "object"
      ? (error as { code?: unknown; command?: unknown; responseCode?: unknown })
      : {};
  console.error("Password reset completion failed", {
    name: error instanceof Error ? error.name : "UnknownError",
    code: typeof details.code === "string" ? details.code : undefined,
    command: typeof details.command === "string" ? details.command : undefined,
    responseCode: typeof details.responseCode === "number" ? details.responseCode : undefined,
  });
}

async function readPayload(request: Request) {
  try {
    const rawBody = await request.text();
    if (rawBody.length > 4096) return null;
    const payload: unknown = JSON.parse(rawBody);
    return payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function validToken(token: unknown): token is string {
  return typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token);
}

export async function POST(request: Request) {
  const noStore = { "Cache-Control": "no-store" };
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Invalid request." }, { status: 403, headers: noStore });
  }
  const payload = await readPayload(request);
  if (!payload || !validToken(payload.token)) {
    return Response.json({ error: "Invalid or expired reset link." }, { status: 400, headers: noStore });
  }

  const tokenHash = createHash("sha256").update(payload.token).digest("hex");
  if (payload.action === "validate") {
    try {
      const valid = await isPasswordResetTokenValid(tokenHash, Date.now());
      return Response.json({ valid }, { headers: noStore });
    } catch (error) {
      logFailure(error);
      return Response.json({ error: "Unable to validate this link right now." }, { status: 503, headers: noStore });
    }
  }

  const password = payload.password;
  const confirmation = payload.confirmation;
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 200 ||
    password !== confirmation
  ) {
    return Response.json(
      { error: "Passwords must match and be between 8 and 200 characters." },
      { status: 400, headers: noStore },
    );
  }

  try {
    const passwordHash = await hash(password, 10);
    const updated = await consumePasswordResetToken(tokenHash, passwordHash, Date.now());
    if (!updated) {
      return Response.json(
        { error: "Invalid or expired reset link." },
        { status: 400, headers: noStore },
      );
    }
    return Response.json({ success: true }, { headers: noStore });
  } catch (error) {
    logFailure(error);
    return Response.json(
      { error: "Unable to reset your password right now. Please try again." },
      { status: 503, headers: noStore },
    );
  }
}
