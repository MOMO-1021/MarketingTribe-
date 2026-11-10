import { hasAdminSession } from "@/lib/admin-session";
import { listAdminMembers } from "@/lib/db";

export const dynamic = "force-dynamic";

function csvCell(value: string | number) {
  let text = String(value);
  if (typeof value === "string" && /^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!(await hasAdminSession())) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const members = await listAdminMembers();
  const rows = [
    ["ID", "Name", "Email", "Practice", "City", "Joined", "Threads", "Replies"],
    ...members.map((member) => [
      member.id,
      member.name,
      member.email,
      member.practice,
      member.city,
      new Date(member.created_at).toISOString(),
      member.thread_count,
      member.reply_count,
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="marketingtribe-members.csv"',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
