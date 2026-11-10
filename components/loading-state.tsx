export function LoadingState({
  message,
  feed = false,
}: {
  message: string;
  feed?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`py-8 ${feed ? "max-w-3xl" : "mx-auto max-w-xl"}`}
    >
      <div className="flex items-center gap-2 text-sm text-mute">
        <span
          aria-hidden="true"
          className="size-3.5 animate-spin rounded-full border-2 border-line border-t-ink motion-reduce:animate-none"
        />
        <span>{message}</span>
      </div>
      <div aria-hidden="true" className="mt-6 space-y-4">
        {feed ? (
          Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="border-t border-line pt-4">
              <div className="h-5 w-2/3 animate-pulse rounded bg-line/70 motion-reduce:animate-none" />
              <div className="mt-3 h-3 w-full animate-pulse rounded bg-line/50 motion-reduce:animate-none" />
              <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-line/50 motion-reduce:animate-none" />
            </div>
          ))
        ) : (
          <>
            <div className="h-9 w-3/4 animate-pulse rounded bg-line/70 motion-reduce:animate-none" />
            <div className="h-4 w-full animate-pulse rounded bg-line/50 motion-reduce:animate-none" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-line/50 motion-reduce:animate-none" />
          </>
        )}
      </div>
      <span className="sr-only">Please wait while the page loads.</span>
    </div>
  );
}
