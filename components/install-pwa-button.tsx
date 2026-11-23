"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [hasPrompt, setHasPrompt] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setHasPrompt(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setHasPrompt(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      setHasPrompt(false);
    } else {
      alert(
        "To install MarketingTribe:\n\n1. Tap the ⋮ (three vertical dots) menu in the top-right corner of Chrome.\n2. Tap \"Install app\" (or \"Add to Home screen\").\n\nThe app will be added directly to your phone's home screen!"
      );
    }
  };

  if (isInstalled) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-paper-dark border border-line px-5 py-2.5 text-sm font-medium text-ink">
        <span>✓</span>
        <span>MarketingTribe is installed on your phone</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleInstallClick}
      className="btn-large w-full sm:w-auto text-base gap-2 px-8 py-3.5 shadow-sm text-center"
    >
      <span>📲 Install App on Phone (Instant)</span>
    </button>
  );
}
