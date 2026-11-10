"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CommunitySummary } from "@/lib/db";

export function CircleNav({ circles }: { circles: CommunitySummary[] }) {
  const path = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:gap-0.5 md:overflow-visible md:pb-0">
      <NavLink href="/home" active={path === "/home"}>
        All circles
      </NavLink>
      {circles.map((circle) => (
        <NavLink key={circle.slug} href={`/c/${circle.slug}`} active={path === `/c/${circle.slug}`}>
          {circle.name}
        </NavLink>
      ))}
      <div className="mx-1 hidden border-t border-line md:my-3 md:block" />
      <NavLink href="/people" active={path === "/people"}>
        People
      </NavLink>
    </nav>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full border px-3 py-1 text-sm md:rounded-md md:border-0 md:px-2 md:py-1.5 ${
        active
          ? "border-ink bg-ink text-paper md:bg-transparent md:text-ink md:font-medium"
          : "border-line text-mute hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}
