"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";

import { SubmitButton } from "@/components/submit-button";

function PendingStatus() {
  const { pending } = useFormStatus();

  return pending ? (
    <p role="status" aria-live="polite" className="text-sm text-mute">
      Sending your request…
    </p>
  ) : null;
}

export function ForgotPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function submit(formData: FormData) {
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
      <PendingStatus />
      {error ? (
        <p role="alert" className="text-sm text-clay">
          {error}
        </p>
      ) : null}
      <SubmitButton className="btn-large" pendingLabel="Sending…">
        Send reset link
      </SubmitButton>
    </form>
  );
}
