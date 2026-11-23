import "server-only";
import { PostHog } from "posthog-node";

export default function PostHogClient() {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!token) return;

  return new PostHog(token, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
    requestTimeout: 2000,
    fetchRetryCount: 0,
  });
}

export async function capturePostHogEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, string | number | boolean | null>,
) {
  let posthog: PostHog | undefined;
  try {
    posthog = PostHogClient();
    posthog?.capture({ distinctId, event, properties });
  } catch (error) {
    console.error("PostHog tracking failed:", error);
  } finally {
    if (posthog) {
      try {
        await posthog.shutdown();
      } catch (error) {
        console.error("PostHog shutdown failed:", error);
      }
    }
  }
}
