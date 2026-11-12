"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(formData: FormData) {
    setPending(true);
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.get("email") }),
      });
      if (!response.ok) throw new Error("Request failed");
      const result: unknown = await response.json();
      if (!result || typeof result !== "object" || !("message" in result) || typeof result.message !== "string") {
        throw new Error("Invalid response");
      }
      router.replace("/forgot-password/sent");
    } catch {
      setError("We could not process your request right now. Please try again later.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      action={submit}
      className="mt-8 space-y-4"
      onSubmit={() => {
        setError("");
      }}
    >
      <label className="block">
        <span className="label">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          maxLength={120}
          required
          className="field"
        />
      </label>
      {pending ? (
        <p role="status" aria-live="polite" className="text-sm text-mute">
          Sending your request…
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-clay">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="btn-large disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? (
          <>
            <span
              aria-hidden="true"
              className="mr-2 inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
            />
            Sending…
          </>
        ) : (
          "Send reset link"
        )}
      </button>
    </form>
  );
}
