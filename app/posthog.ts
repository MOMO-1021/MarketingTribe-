import "server-only";
import { PostHog } from "posthog-node";

export default function PostHogClient() {
  const posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  });

  return posthog;
}

export async function capturePostHogEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, string | number | boolean | null>,
) {
  let posthog: PostHog | undefined;
  try {
    if (!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
      throw new Error("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is not configured.");
    }

    posthog = PostHogClient();
    posthog.capture({ distinctId, event, properties });
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
