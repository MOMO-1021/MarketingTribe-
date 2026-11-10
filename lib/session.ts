import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getUserById, type PublicUser } from "./db";

const COOKIE = "adda_session";
const MAX_AGE = 60 * 60 * 24 * 30;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    throw new Error("SESSION_SECRET is missing. Add it to .env.local.");
  }
  return value;
}

function seal(userId: number) {
  const body = Buffer.from(
    JSON.stringify({ uid: userId, exp: Date.now() + MAX_AGE * 1000 }),
  ).toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function open(token: string): number | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const actualBuffer = Buffer.from(sig);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as {
      uid?: unknown;
      exp?: unknown;
    };
    if (typeof data.uid !== "number" || typeof data.exp !== "number") return null;
    if (data.exp < Date.now()) return null;
    return data.uid;
  } catch {
    return null;
  }
}

export async function setSession(userId: number) {
  const jar = await cookies();
  jar.set(COOKIE, seal(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const userId = open(token);
  if (!userId) return null;
  return getUserById(userId);
}
