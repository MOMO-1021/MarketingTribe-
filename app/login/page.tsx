import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { Wordmark } from "@/components/wordmark";
import { login } from "@/lib/actions";
import { errorMessage } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; success?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/home");
  const { e, success } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <Wordmark href="/" />
      <h1 className="mt-8 font-serif text-4xl tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-mute">The room is on the other side of your account.</p>
      <form action={login} className="mt-8 space-y-4">
        {success === "reset" || success === "deleted" ? (
          <p role="status" className="text-sm text-emerald-700">
            {success === "reset"
              ? "Your password has been updated. Sign in with your new password."
              : "Your account has been deleted."}
          </p>
        ) : null}
        <FormError message={errorMessage(e)} />
        <label className="block">
          <span className="label">Email</span>
          <input name="email" type="email" autoComplete="email" required className="field" />
        </label>
        <label className="block">
          <span className="label">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="field"
          />
        </label>
        <div className="-mt-2 text-right">
          <Link
            href="/forgot-password"
            className="inline-block text-xs text-mute underline decoration-line underline-offset-4 hover:text-ink"
          >
            Forgot password?
          </Link>
        </div>
        <SubmitButton className="btn-large" pendingLabel="Signing in…">
          Enter
        </SubmitButton>
      </form>
      <p className="mt-6 text-sm text-mute">
        New here?{" "}
        <Link href="/signup" className="text-ink underline decoration-line underline-offset-4">
          Create an account
        </Link>
      </p>
    </main>
  );
}
