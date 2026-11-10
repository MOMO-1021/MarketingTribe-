import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormError } from "@/components/form-error";
import { PostList } from "@/components/post-list";
import { saveProfile } from "@/lib/actions";
import { errorMessage, PRACTICES } from "@/lib/constants";
import { getUserById, listPosts } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const person = await getUserById(Number(id));
  return { title: person?.name ?? "Profile" };
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ e?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const person = await getUserById(id);
  if (!person) notFound();
  const posts = await listPosts({ viewerId: user.id, authorId: person.id });
  const isSelf = person.id === user.id;
  const { e } = await searchParams;
  const practiceChoices = PRACTICES.includes(person.practice as (typeof PRACTICES)[number])
    ? PRACTICES
    : person.practice === "Host"
      ? null
      : PRACTICES;

  return (
    <div>
      <h1 className="font-serif text-3xl tracking-tight">{person.name}</h1>
      <p className="mt-2 text-sm text-mute">
        {person.practice} · {person.city}
      </p>
      <p className="mt-1 text-xs text-mute">Joined {formatDate(person.created_at)}</p>
      {isSelf ? <p className="mt-1 text-xs text-mute">{person.email}</p> : null}

      {isSelf && practiceChoices ? (
        <form action={saveProfile} className="mt-6 max-w-md space-y-4 border-t border-line pt-6">
          <h2 className="font-serif text-xl tracking-tight">Your details</h2>
          <FormError message={errorMessage(e)} />
          <label className="block">
            <span className="label">Name</span>
            <input name="name" required maxLength={40} defaultValue={person.name} className="field" />
          </label>
          <label className="block">
            <span className="label">What you work on</span>
            <select name="practice" defaultValue={person.practice} className="field">
              {practiceChoices.map((practice) => (
                <option key={practice} value={practice}>
                  {practice}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">City</span>
            <input name="city" required maxLength={40} defaultValue={person.city} className="field" />
          </label>
          <button type="submit" className="btn">
            Save
          </button>
        </form>
      ) : null}

      <h2 className="mb-2 mt-10 font-serif text-xl tracking-tight">Threads</h2>
      <PostList posts={posts} empty={isSelf ? "You have not started a thread yet." : "No threads yet."} />
    </div>
  );
}
