import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import { getCurrentUser } from "@/lib/session";

export default async function MainLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.welcome_read_at === null) redirect("/welcome");
  return <Shell user={user}>{children}</Shell>;
}
