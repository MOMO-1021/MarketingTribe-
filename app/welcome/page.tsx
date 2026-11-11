import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/submit-button";
import { acknowledgeWelcome } from "@/lib/actions";
import { getWelcomePost } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "A note before you start" };

export default async function WelcomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.welcome_read_at !== null) redirect("/home");

  const post = await getWelcomePost(user.id);
  if (!post) throw new Error("The welcome thread could not be found.");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <p className="text-sm text-mute">One thing before you enter the room</p>
      <h1 className="mt-2 font-serif text-4xl tracking-tight">{post.title}</h1>
      <article className="mt-6 whitespace-pre-wrap border-y border-line py-6 text-[15px] leading-relaxed">
        {post.body}
      </article>
      <form action={acknowledgeWelcome} className="mt-6">
        <SubmitButton className="btn-large" pendingLabel="Opening the room…">
          I’ve read this — enter the room
        </SubmitButton>
      </form>
    </main>
  );
}
