import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

export const metadata: Metadata = { title: "Check your email" };

export default function ForgotPasswordSentPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <Wordmark href="/" />
      <h1 className="mt-8 font-serif text-4xl tracking-tight">Check your email</h1>
      <div role="status" className="mt-4 space-y-3 text-sm leading-relaxed text-mute">
        <p>
          Your request was received. If an account exists for that address and email delivery is
          available, reset instructions should arrive shortly.
        </p>
        <p>
          Check your inbox and spam folder. For security, we can’t confirm whether an address is
          registered.
        </p>
        <p>The reset link expires after 30 minutes and can only be used once.</p>
      </div>
      <p className="mt-6 text-sm text-mute">
        Need to try another address?{" "}
        <Link href="/forgot-password" className="text-ink underline decoration-line underline-offset-4">
          Request another reset link
        </Link>
      </p>
      <p className="mt-3 text-sm text-mute">
        <Link href="/login" className="text-ink underline decoration-line underline-offset-4">
          Back to sign in
        </Link>
      </p>
    </main>
  );
}
