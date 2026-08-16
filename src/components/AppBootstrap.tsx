"use client";

import { useEffect, useState } from "react";
import { ensureSeeded } from "@/lib/db/seed";
import { registerServiceWorker } from "@/lib/pwa/register-sw";

export function AppBootstrap({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    registerServiceWorker();
    ensureSeeded().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <div className="text-sm font-medium tracking-wide text-text-muted">Loading…</div>
      </div>
    );
  }

  return <>{children}</>;
}
