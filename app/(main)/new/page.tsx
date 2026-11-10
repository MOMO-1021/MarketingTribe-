import type { Metadata } from "next";
import { FormError } from "@/components/form-error";
import { publishThread } from "@/lib/actions";
import { errorMessage } from "@/lib/constants";
import { listCommunities } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "New thread" };

export default async function NewThreadPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; c?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const params = await searchParams;
  const circles = await listCommunities();
  const selected = circles.some((circle) => circle.slug === params.c) ? params.c : "general";

  return (
    <div className="max-w-xl">
      <h1 className="font-serif text-3xl tracking-tight">New thread</h1>
      <p className="mt-2 text-sm leading-relaxed text-mute">
        A clear title does most of the work. Add the constraint, the channel, or what you already tried.
      </p>
      <form action={publishThread} className="mt-6 space-y-4">
        <FormError message={errorMessage(params.e)} />
        <label className="block">
          <span className="label">Circle</span>
          <select name="community" defaultValue={selected} className="field">
            {circles.map((circle) => (
              <option key={circle.id} value={circle.slug}>
                {circle.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Title</span>
          <input name="title" required minLength={8} maxLength={160} className="field" />
        </label>
        <label className="block">
          <span className="label">Details</span>
          <textarea name="body" rows={8} maxLength={8000} className="field resize-y" placeholder="Optional, but specifics help." />
        </label>
        <button type="submit" className="btn-large">
          Post thread
        </button>
      </form>
    </div>
  );
}
