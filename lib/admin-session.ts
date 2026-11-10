import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "marketingtribe_admin";
const MAX_AGE = 60 * 60 * 8;

function credentials() {
  const code = process.env.ADMIN_ACCESS_CODE;
  const password = process.env.ADMIN_PASSWORD;
  if (
    !code ||
    !password ||
    code.length < 16 ||
    password.length < 16 ||
    code.length > 256 ||
    password.length > 256
  ) {
    return null;
  }
  return { code, password };
}

function signingKey() {
  const secret = process.env.SESSION_SECRET;
  const configured = credentials();
  if (!secret || secret.length < 32 || !configured) return null;
  return createHmac("sha256", secret)
    .update("marketingtribe-admin-session")
    .update(configured.code)
    .update(configured.password)
    .digest();
}

function signature(body: string, key: Buffer) {
  return createHmac("sha256", key).update(body).digest("base64url");
}

function safeEqual(left: string, right: string, key: Buffer) {
  const leftHash = createHmac("sha256", key).update(left).digest();
  const rightHash = createHmac("sha256", key).update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

export function adminLoginConfigured() {
  return signingKey() !== null;
}

export function checkAdminCredentials(code: string, password: string) {
  const configured = credentials();
  const key = signingKey();
  if (!configured || !key) return false;
  return safeEqual(code, configured.code, key) && safeEqual(password, configured.password, key);
}

export async function setAdminSession() {
  const key = signingKey();
  if (!key) throw new Error("Admin credentials are not configured.");
  const body = Buffer.from(JSON.stringify({ exp: Date.now() + MAX_AGE * 1000 })).toString(
    "base64url",
  );
  const jar = await cookies();
  jar.set(COOKIE, `${body}.${signature(body, key)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function hasAdminSession() {
  const key = signingKey();
  if (!key) return false;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;

  const [body, suppliedSignature, extra] = token.split(".");
  if (!body || !suppliedSignature || extra) return false;
  if (!safeEqual(suppliedSignature, signature(body, key), key)) return false;

  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as { exp?: unknown };
    return typeof data.exp === "number" && data.exp > Date.now();
  } catch {
    return false;
  }
}
