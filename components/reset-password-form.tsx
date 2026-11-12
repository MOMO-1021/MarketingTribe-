"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type LinkState = "checking" | "valid" | "invalid" | "error";

export function ResetPasswordForm() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [linkState, setLinkState] = useState<LinkState>("checking");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const initialTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (initialTokenRef.current === null) {
      initialTokenRef.current = new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
      window.history.replaceState(window.history.state, "", window.location.pathname);
    }
    const resetToken = initialTokenRef.current;
    if (!/^[A-Za-z0-9_-]{43}$/.test(resetToken)) {
      setLinkState("invalid");
      return;
    }

    let active = true;
    setToken(resetToken);
    fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "validate", token: resetToken }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to validate reset link.");
        const result: unknown = await response.json();
        if (!result || typeof result !== "object" || !("valid" in result) || typeof result.valid !== "boolean") {
          throw new Error("Invalid response.");
        }
        if (active) setLinkState(result.valid ? "valid" : "invalid");
      })
      .catch(() => {
        if (active) setLinkState("error");
      });

    return () => {
      active = false;
    };
  }, []);

  async function submit(formData: FormData) {
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("confirmation") ?? "");
    setError("");

    if (password.length < 8 || password.length > 200) {
      setError("Use a password between 8 and 200 characters.");
      return;
    }
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }
    if (!token || linkState !== "valid") {
      setError("This reset link is invalid or has expired. Request a new one.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmation }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message =
          result && typeof result === "object" && "error" in result && typeof result.error === "string"
            ? result.error
            : "Unable to reset your password.";
        throw new Error(message);
      }
      router.replace("/login?success=reset");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to reset your password. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  if (linkState === "checking") {
    return <p role="status" className="mt-8 text-sm text-mute">Checking your reset link…</p>;
  }

  if (linkState === "invalid" || linkState === "error") {
    return (
      <div className="mt-8 space-y-3">
        <p role="alert" className="text-sm text-clay">
          {linkState === "invalid"
            ? "This reset link is invalid, expired, or already used."
            : "We could not verify this reset link right now. Please try again."}
        </p>
        <a href="/forgot-password" className="text-sm text-ink underline decoration-line underline-offset-4">
          Request a new reset link
        </a>
      </div>
    );
  }

  return (
    <form action={submit} className="mt-8 space-y-4">
      <label className="block">
        <span className="label">New password</span>
        <input
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          minLength={8}
          maxLength={200}
          required
          className="field"
        />
      </label>
      <label className="block">
        <span className="label">Confirm new password</span>
        <input
          name="confirmation"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          minLength={8}
          maxLength={200}
          required
          className="field"
        />
      </label>
      <button
        type="button"
        aria-pressed={showPassword}
        onClick={() => setShowPassword((visible) => !visible)}
        className="text-xs text-mute hover:text-ink"
      >
        {showPassword ? "Hide passwords" : "Show passwords"}
      </button>
      <p className="text-xs text-mute">Use 8–200 characters.</p>
      {error ? <p role="alert" className="text-sm text-clay">{error}</p> : null}
      <button type="submit" disabled={pending} className="btn-large disabled:opacity-60">
        {pending ? "Updating password…" : "Update password"}
      </button>
    </form>
  );
}
