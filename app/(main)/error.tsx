"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="py-10">
      <p className="font-serif text-2xl tracking-tight">Something slipped.</p>
      <button type="button" onClick={reset} className="btn mt-4">
        Try again
      </button>
    </div>
  );
}
