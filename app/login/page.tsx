import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FormError } from "@/components/form-error";
import { Wordmark } from "@/components/wordmark";
import { login } from "@/lib/actions";
import { errorMessage } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/home");
  const { e } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <Wordmark href="/" />
      <h1 className="mt-8 font-serif text-4xl tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-mute">The room is on the other side of your account.</p>
      <form action={login} className="mt-8 space-y-4">
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
        <button type="submit" className="btn-large">
          Enter
        </button>
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
