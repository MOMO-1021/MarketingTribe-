import type { Metadata } from "next";
import { CircleFeed } from "@/components/circle-feed";
import { listMembers } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "People" };

export default async function PeoplePage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const members = await listMembers();

  return <CircleFeed initialHref="/people" initialPeople={members} />;
}
