"use client";

import { useState } from "react";

export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(formData: FormData) {
    setPending(true);
    setMessage("");
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
      setMessage(result.message);
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
        setMessage("");
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
      {message ? (
        <p role="status" className="text-sm leading-relaxed text-mute">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-clay">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className="btn-large disabled:opacity-60">
        {pending ? "Checking…" : "Send reset link"}
      </button>
    </form>
  );
}
