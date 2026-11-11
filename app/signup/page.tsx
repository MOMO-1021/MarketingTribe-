import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { Wordmark } from "@/components/wordmark";
import { signup } from "@/lib/actions";
import { errorMessage, PRACTICES } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Create an account" };

export default async function SignupPage({
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
      <h1 className="mt-8 font-serif text-4xl tracking-tight">Create an account</h1>
      <p className="mt-2 text-sm leading-relaxed text-mute">
        MarketingTribe is for marketers working in India. An account is the only way in.
      </p>
      <form action={signup} className="mt-8 space-y-4">
        <FormError message={errorMessage(e)} />
        <label className="block">
          <span className="label">Name</span>
          <input name="name" autoComplete="name" required maxLength={40} className="field" />
        </label>
        <label className="block">
          <span className="label">Email</span>
          <input name="email" type="email" autoComplete="email" required className="field" />
        </label>
        <label className="block">
          <span className="label">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="field"
          />
        </label>
        <label className="block">
          <span className="label">What you work on</span>
          <select name="practice" required defaultValue="" className="field">
            <option value="" disabled>
              Choose one
            </option>
            {PRACTICES.map((practice) => (
              <option key={practice} value={practice}>
                {practice}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">City you work in</span>
          <input
            name="city"
            required
            maxLength={40}
            placeholder="Pune, Jaipur, Kochi…"
            autoComplete="address-level2"
            className="field"
          />
        </label>
        <label className="flex items-start gap-2 text-sm leading-relaxed">
          <input type="checkbox" name="confirm" required />
          <span>I do marketing work, and India is where I do it.</span>
        </label>
        <SubmitButton className="btn-large" pendingLabel="Creating account…">
          Join MarketingTribe
        </SubmitButton>
      </form>
      <p className="mt-6 text-sm text-mute">
        Already have an account?{" "}
        <Link href="/login" className="text-ink underline decoration-line underline-offset-4">
          Sign in
        </Link>
      </p>
    </main>
  );
}
