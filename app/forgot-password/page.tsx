import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { Wordmark } from "@/components/wordmark";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <Wordmark href="/" />
      <h1 className="mt-8 font-serif text-4xl tracking-tight">Forgot your password?</h1>
      <p className="mt-2 text-sm leading-relaxed text-mute">
        Enter the email address linked to your account. If it matches an account, we’ll provide reset instructions.
      </p>
      <ForgotPasswordForm />
      <p className="mt-6 text-sm text-mute">
        Remembered it?{" "}
        <Link href="/login" className="text-ink underline decoration-line underline-offset-4">
          Sign in
        </Link>
      </p>
    </main>
  );
}
