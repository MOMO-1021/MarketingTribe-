"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "./wordmark";
import type { CommunitySummary, PublicUser } from "@/lib/db";
import { logout } from "@/lib/actions";

export function AppHeader({
  user,
  circles,
}: {
  user: PublicUser;
  circles: CommunitySummary[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showCircles, setShowCircles] = useState(false);
  const pathname = usePathname();

  // Close drawer whenever pathname changes (user navigated)
  useEffect(() => {
    setIsOpen(false);
    setIsSearchOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:py-3">
          {/* Brand Wordmark */}
          <div className="shrink-0">
            <Wordmark href="/home" />
          </div>

          {/* Desktop Search Bar (Hidden on mobile) */}
          <form action="/home" className="hidden min-w-0 flex-1 sm:block sm:max-w-xs md:max-w-sm">
            <div className="relative">
              <input
                name="q"
                placeholder="Search threads…"
                aria-label="Search threads"
                className="field py-1.5 pl-8 pr-3 text-sm"
              />
              <svg
                className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mute"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </form>

          {/* Desktop Navigation Links (md and larger) */}
          <div className="hidden items-center gap-4 md:flex">
            <Link href="/new" className="btn whitespace-nowrap">
              <span>New thread</span>
            </Link>
            <Link href={`/u/${user.id}`} className="text-sm hover:text-ink truncate max-w-[140px]">
              <span className="font-medium">{user.name}</span>
              <span className="text-mute"> · {user.city}</span>
            </Link>
            <Link href="/download" className="text-sm text-mute hover:text-ink whitespace-nowrap">
              Android app
            </Link>
            <Link href="/settings" className="text-sm text-mute hover:text-ink whitespace-nowrap">
              Settings
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="text-sm text-mute hover:text-ink whitespace-nowrap"
              >
                Sign out
              </button>
            </form>
          </div>

          {/* Mobile Right Controls: Search icon, New button, Hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink/75 hover:bg-black/5 hover:text-ink transition"
              aria-label="Search threads"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            <Link href="/new" className="btn text-xs px-3 py-1.5 font-medium whitespace-nowrap">
              <span>+ New</span>
            </Link>

            {/* Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink hover:bg-black/5 transition focus:outline-none"
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
            >
              <div className="flex h-4 w-5 flex-col justify-between">
                <span
                  className={`h-0.5 w-full bg-ink transition-transform duration-200 ease-in-out ${
                    isOpen ? "translate-y-[7px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`h-0.5 w-full bg-ink transition-opacity duration-200 ease-in-out ${
                    isOpen ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`h-0.5 w-full bg-ink transition-transform duration-200 ease-in-out ${
                    isOpen ? "-translate-y-[7px] -rotate-45" : ""
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Quick Search Bar (Toggles when search icon is clicked) */}
        {isSearchOpen && (
          <div className="border-t border-line bg-paper px-4 py-2.5 sm:hidden">
            <form action="/home" className="flex items-center gap-2">
              <input
                autoFocus
                name="q"
                placeholder="Search threads in MarketingTribe…"
                aria-label="Search threads"
                className="field flex-1 py-1.5 text-sm"
              />
              <button type="submit" className="btn text-xs px-3 py-2 whitespace-nowrap">
                Search
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-xs flex-col bg-paper shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <Wordmark href="/home" />
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-mute hover:bg-black/5 hover:text-ink transition"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* User Profile Card */}
          <Link
            href={`/u/${user.id}`}
            className="flex items-center gap-3 rounded-xl border border-line bg-white/70 p-3 hover:bg-white transition"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-paper">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{user.name}</p>
              <p className="truncate text-xs text-mute">
                {user.city} · {user.practice}
              </p>
            </div>
            <span className="text-xs text-mute">Profile →</span>
          </Link>

          {/* Mobile Search Bar inside Drawer */}
          <form action="/home">
            <div className="relative">
              <input
                name="q"
                placeholder="Search threads…"
                className="field py-2 pl-9 pr-3 text-sm"
              />
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </form>

          {/* Primary Action Button */}
          <Link
            href="/new"
            className="btn-large w-full justify-center text-sm py-2.5 font-medium shadow-sm"
          >
            + Start a thread
          </Link>

          {/* Main Navigation List */}
          <nav className="space-y-1 border-t border-line pt-4">
            <p className="px-2 pb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-mute">
              Community
            </p>

            <Link
              href="/home"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname === "/home"
                  ? "bg-ink text-paper"
                  : "text-ink/80 hover:bg-black/5 hover:text-ink"
              }`}
            >
              <span>💬</span>
              <span>All circles</span>
            </Link>

            {/* Circles Accordion / List */}
            <div>
              <button
                type="button"
                onClick={() => setShowCircles(!showCircles)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-ink/80 hover:bg-black/5 hover:text-ink transition"
              >
                <div className="flex items-center gap-3">
                  <span>⭕</span>
                  <span>Circles ({circles.length})</span>
                </div>
                <span className="text-xs text-mute">{showCircles ? "▲" : "▼"}</span>
              </button>

              {showCircles && (
                <div className="ml-8 mt-1 space-y-1 border-l-2 border-line pl-2">
                  {circles.map((circle) => (
                    <Link
                      key={circle.slug}
                      href={`/c/${circle.slug}`}
                      className={`block rounded-md px-2 py-1.5 text-xs transition ${
                        pathname === `/c/${circle.slug}`
                          ? "font-semibold text-ink bg-line/60"
                          : "text-mute hover:text-ink"
                      }`}
                    >
                      {circle.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/people"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname === "/people"
                  ? "bg-ink text-paper"
                  : "text-ink/80 hover:bg-black/5 hover:text-ink"
              }`}
            >
              <span>👥</span>
              <span>People directory</span>
            </Link>

            <Link
              href="/quizzes"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname.startsWith("/quizzes")
                  ? "bg-ink text-paper"
                  : "text-ink/80 hover:bg-black/5 hover:text-ink"
              }`}
            >
              <span>🏆</span>
              <span>Weekly quizzes</span>
            </Link>
          </nav>

          {/* Preferences & App */}
          <nav className="space-y-1 border-t border-line pt-4">
            <p className="px-2 pb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-mute">
              Preferences
            </p>

            <Link
              href="/download"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname === "/download"
                  ? "bg-ink text-paper"
                  : "text-ink/80 hover:bg-black/5 hover:text-ink"
              }`}
            >
              <span>📱</span>
              <span>Download Android app</span>
            </Link>

            <Link
              href="/settings"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname === "/settings"
                  ? "bg-ink text-paper"
                  : "text-ink/80 hover:bg-black/5 hover:text-ink"
              }`}
            >
              <span>⚙️</span>
              <span>Account settings</span>
            </Link>
          </nav>
        </div>

        {/* Drawer Footer with Sign Out */}
        <div className="border-t border-line p-4 bg-paper">
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-white/80 py-2.5 text-sm font-medium text-ink hover:bg-white transition"
            >
              <svg className="h-4 w-4 text-mute" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
