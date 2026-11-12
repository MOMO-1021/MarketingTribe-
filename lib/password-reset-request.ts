export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const appUrl = process.env.APP_URL;
    if (!appUrl) return false;
    return new URL(origin).origin === new URL(appUrl).origin;
  } catch {
    return false;
  }
}
