import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { Wordmark } from "@/components/wordmark";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <Wordmark href="/" />
      <h1 className="mt-8 font-serif text-4xl tracking-tight">Choose a new password</h1>
      <p className="mt-2 text-sm text-mute">Your reset link is valid for 30 minutes and can only be used once.</p>
      <ResetPasswordForm />
      <p className="mt-6 text-sm text-mute">
        <Link href="/login" className="text-ink underline decoration-line underline-offset-4">
          Back to sign in
        </Link>
      </p>
    </main>
  );
}
