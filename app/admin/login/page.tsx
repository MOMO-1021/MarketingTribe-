import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormError } from "@/components/form-error";
import { adminLogin } from "@/lib/admin-actions";
import { adminLoginConfigured, hasAdminSession } from "@/lib/admin-session";

export const metadata: Metadata = { title: "Admin sign in" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  if (await hasAdminSession()) redirect("/admin");
  const { e } = await searchParams;
  const configured = adminLoginConfigured();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <p className="text-xs uppercase tracking-[0.16em] text-mute">MarketingTribe · Private</p>
      <h1 className="mt-4 font-serif text-4xl tracking-tight">Admin sign in</h1>
      <p className="mt-2 text-sm leading-relaxed text-mute">
        Enter your private access code and password to view community member data.
      </p>
      {!configured ? (
        <p className="mt-6 rounded-lg border border-line bg-white p-4 text-sm leading-relaxed text-clay" role="alert">
          Admin access is not configured. Set ADMIN_ACCESS_CODE and ADMIN_PASSWORD to private
          values of at least 16 characters, and ensure SESSION_SECRET is set to a random value of
          at least 32 characters in the server environment.
        </p>
      ) : (
        <form action={adminLogin} className="mt-8 space-y-4">
          <FormError message={e === "credentials" ? "The access code or password is incorrect." : undefined} />
          <label className="block">
            <span className="label">Unique access code</span>
            <input name="code" autoComplete="username" required maxLength={256} className="field" />
          </label>
          <label className="block">
            <span className="label">Password</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={256}
              className="field"
            />
          </label>
          <button type="submit" className="btn-large">
            Sign in
          </button>
        </form>
      )}
    </main>
  );
}
