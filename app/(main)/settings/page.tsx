import type { Metadata } from "next";
import Link from "next/link";
import { FormError } from "@/components/form-error";
import { SubmitButton } from "@/components/submit-button";
import { deleteAccount } from "@/lib/actions";
import { errorMessage } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { e } = await searchParams;

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-3xl tracking-tight">Settings</h1>
      <section className="mt-8 border-t border-line pt-5">
        <h2 className="font-serif text-xl tracking-tight">Account</h2>
        <p className="mt-2 text-sm text-mute">{user.email}</p>
        <Link
          href={`/u/${user.id}`}
          className="mt-3 inline-block text-sm text-ink underline decoration-line underline-offset-4"
        >
          Edit account details
        </Link>
      </section>

      <section className="mt-10 border-t border-line pt-5">
        <h2 className="font-serif text-xl tracking-tight">Delete account</h2>
        <p className="mt-2 text-sm leading-relaxed text-mute">
          This permanently removes your login and profile details. Your threads and replies will remain
          visible as “Deleted member”; your votes and reset links will be removed. You will be signed
          out.
        </p>
        <form action={deleteAccount} className="mt-5 max-w-md space-y-4">
          <FormError message={errorMessage(e)} />
          <label className="block">
            <span className="label">Confirm your current password</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={200}
              className="field"
            />
          </label>
          <SubmitButton className="btn border border-clay text-clay" pendingLabel="Deleting account…">
            Delete my account
          </SubmitButton>
        </form>
      </section>
    </div>
  );
}
