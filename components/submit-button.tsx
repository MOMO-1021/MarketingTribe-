"use client";

import { useEffect, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import posthog from "posthog-js";

export function SubmitButton({
  children,
  pendingLabel,
  className,
  posthogPerson,
}: {
  children: ReactNode;
  pendingLabel: string;
  className: string;
  posthogPerson?: {
    id: number;
    email: string;
    name: string;
    practice: string;
  };
}) {
  const { pending } = useFormStatus();

  useEffect(() => {
    if (!posthogPerson) return;

    posthog.identify(String(posthogPerson.id), {
      email: posthogPerson.email,
      name: posthogPerson.name,
      practice: posthogPerson.practice,
    });
  }, [posthogPerson]);

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${className} disabled:cursor-wait disabled:opacity-70`}
    >
      {pending ? (
        <>
          <span
            aria-hidden="true"
            className="mr-2 inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
          />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
