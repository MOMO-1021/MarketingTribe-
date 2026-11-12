import { createHash, createHmac, randomBytes } from "crypto";
import {
  consumePasswordResetRateLimit,
  createPasswordResetToken,
  deletePasswordResetToken,
  getPasswordResetRecipient,
} from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/password-reset-email";
import { isSameOriginRequest } from "@/lib/password-reset-request";

export const runtime = "nodejs";

const WINDOW_MS = 15 * 60 * 1000;
const GENERIC_MESSAGE =
  "If an account exists for that email, reset instructions will be sent if email delivery is available. If you do not receive one, check spam or try again later.";

function genericResponse() {
  return Response.json({ message: GENERIC_MESSAGE }, { headers: { "Cache-Control": "no-store" } });
}

function logFailure(stage: string, error: unknown) {
  const details =
    error && typeof error === "object"
      ? (error as { code?: unknown; command?: unknown; responseCode?: unknown })
      : {};
  console.error("Password reset request failed", {
    stage,
    name: error instanceof Error ? error.name : "UnknownError",
    code: typeof details.code === "string" ? details.code : undefined,
    command: typeof details.command === "string" ? details.command : undefined,
    responseCode: typeof details.responseCode === "number" ? details.responseCode : undefined,
  });
}

function hashRateKey(kind: "ip" | "email", value: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not configured.");
  return createHmac("sha256", secret).update(`${kind}:${value}`).digest("hex");
}

function clientAddress(request: Request) {
  const netlifyAddress = request.headers.get("x-nf-client-connection-ip")?.trim();
  if (netlifyAddress) return netlifyAddress;
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",").at(-1)?.trim() || "unknown";
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return genericResponse();

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return genericResponse();
  }
  if (rawBody.length > 2048) {
    return genericResponse();
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return genericResponse();
  }

  const submittedEmail =
    payload && typeof payload === "object" && "email" in payload && typeof payload.email === "string"
      ? payload.email.trim().toLowerCase()
      : "";
  const now = Date.now();

  try {
    const ipAllowed = await consumePasswordResetRateLimit(
      hashRateKey("ip", clientAddress(request)),
      now,
      WINDOW_MS,
      10,
    );
    if (!ipAllowed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submittedEmail) || submittedEmail.length > 120) {
      return genericResponse();
    }

    const emailAllowed = await consumePasswordResetRateLimit(
      hashRateKey("email", submittedEmail),
      now,
      60 * 60 * 1000,
      3,
    );
    if (!emailAllowed) return genericResponse();

    const recipient = await getPasswordResetRecipient(submittedEmail);
    if (!recipient) return genericResponse();

    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await createPasswordResetToken(recipient.id, tokenHash, now, now + 30 * 60 * 1000);

    try {
      await sendPasswordResetEmail({
        email: submittedEmail,
        name: recipient.name,
        token,
      });
    } catch (error) {
      logFailure("email_delivery", error);
      try {
        await deletePasswordResetToken(tokenHash);
      } catch (cleanupError) {
        logFailure("token_cleanup", cleanupError);
      }
    }
  } catch (error) {
    logFailure("request", error);
  }

  return genericResponse();
}
