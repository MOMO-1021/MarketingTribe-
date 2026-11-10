import type { Metadata } from "next";
import Link from "next/link";
import { listMembers } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "People" };

export default async function PeoplePage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const members = await listMembers();

  return (
    <div>
      <h1 className="font-serif text-[1.7rem] tracking-tight">People</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-mute">
        Everyone in the room. Open a profile to see what they have been talking about.
      </p>
      {members.length === 0 ? (
        <p className="mt-8 border-t border-line py-8 text-sm text-mute">No members yet.</p>
      ) : (
        <ul className="mt-6 border-t border-line">
          {members.map((member) => (
            <li key={member.id} className="border-b border-line py-4">
              <Link href={`/u/${member.id}`} className="font-serif text-xl tracking-tight hover:underline">
                {member.name}
              </Link>
              <p className="mt-1 text-sm text-mute">
                {member.practice} · {member.city}
              </p>
              <p className="mt-1 text-xs text-mute">Joined {formatDate(member.created_at)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
