"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { CircleFeed } from "@/components/circle-feed";
import { useCircleFeedStore } from "./circle-feed-provider";

export function WorkspaceContentBridge({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { shallowNavigation } = useCircleFeedStore();
  const isWorkspacePath =
    pathname === "/home" || pathname === "/people" || pathname.startsWith("/c/");

  if (shallowNavigation && isWorkspacePath) {
    return <CircleFeed initialHref={pathname} />;
  }
  return children;
}
