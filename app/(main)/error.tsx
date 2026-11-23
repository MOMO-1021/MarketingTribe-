"use client";

import posthog from "posthog-js";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    posthog.captureException(error);
  }, [error]);

  return (
    <div className="py-10">
      <p className="font-serif text-2xl tracking-tight">Something slipped.</p>
      <button type="button" onClick={reset} className="btn mt-4">
        Try again
      </button>
    </div>
  );
}
