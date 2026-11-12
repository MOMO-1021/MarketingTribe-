import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { getUserById, type SessionUser } from "./db";

const COOKIE = "adda_session";
const MAX_AGE = 60 * 60 * 24 * 30;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    throw new Error("SESSION_SECRET is missing. Add it to .env.local.");
  }
  return value;
}

type SessionClaims = {
  userId: number;
  sessionVersion: number;
};

function seal(userId: number, sessionVersion: number) {
  const body = Buffer.from(
    JSON.stringify({ uid: userId, sv: sessionVersion, exp: Date.now() + MAX_AGE * 1000 }),
  ).toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function open(token: string): SessionClaims | null {
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
      sv?: unknown;
      exp?: unknown;
    };
    if (typeof data.uid !== "number" || typeof data.exp !== "number") return null;
    if (data.sv !== undefined && typeof data.sv !== "number") return null;
    if (data.exp < Date.now()) return null;
    return { userId: data.uid, sessionVersion: data.sv ?? 0 };
  } catch {
    return null;
  }
}

export async function setSession(userId: number, sessionVersion = 0) {
  const jar = await cookies();
  jar.set(COOKIE, seal(userId, sessionVersion), {
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

export const getCurrentUser = cache(async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const claims = open(token);
  if (!claims) return null;
  const user = await getUserById(claims.userId);
  if (!user || user.session_version !== claims.sessionVersion) return null;
  return user;
});
