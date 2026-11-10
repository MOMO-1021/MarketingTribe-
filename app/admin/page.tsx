import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { adminLogout } from "@/lib/admin-actions";
import { hasAdminSession } from "@/lib/admin-session";
import { listAdminMembers } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Community dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  if (!(await hasAdminSession())) redirect("/admin/login");
  const members = await listAdminMembers();

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-mute">MarketingTribe · Private</p>
          <h1 className="mt-2 font-serif text-3xl tracking-tight">Community dashboard</h1>
          <p className="mt-2 text-sm text-mute">Member details and community activity.</p>
        </div>
        <div className="flex items-center gap-4">
          <a href="/admin/export" className="text-sm underline decoration-line underline-offset-4">
            Download CSV
          </a>
          <form action={adminLogout}>
            <button type="submit" className="text-sm text-mute hover:text-ink">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <section className="mt-6">
        <p className="text-xs uppercase tracking-[0.14em] text-mute">Members</p>
        <p className="mt-1 font-serif text-3xl tabular-nums">{members.length}</p>
      </section>

      {members.length === 0 ? (
        <p className="mt-8 border-t border-line py-8 text-sm text-mute">No members have signed up yet.</p>
      ) : (
        <div className="mt-8 overflow-x-auto border-t border-line">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-mute">
                <th scope="col" className="px-3 py-3 font-medium">Member</th>
                <th scope="col" className="px-3 py-3 font-medium">Email</th>
                <th scope="col" className="px-3 py-3 font-medium">Practice</th>
                <th scope="col" className="px-3 py-3 font-medium">City</th>
                <th scope="col" className="px-3 py-3 font-medium">Joined</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">Threads</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">Replies</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b border-line align-top">
                  <td className="px-3 py-3 font-medium">{member.name}</td>
                  <td className="px-3 py-3">{member.email}</td>
                  <td className="px-3 py-3">{member.practice}</td>
                  <td className="px-3 py-3">{member.city}</td>
                  <td className="px-3 py-3">{formatDate(member.created_at)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{member.thread_count}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{member.reply_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
