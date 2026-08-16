"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { updateSettings } from "@/lib/db/repo/settings";
import type { ReturnPrompt } from "@/lib/engine/calibration";

export function ReturnPromptBanner({ prompt }: { prompt: ReturnPrompt }) {
  const [dismissed, setDismissed] = useState(false);
  if (!prompt.show || dismissed) return null;

  async function chooseLighterRestart() {
    await updateSettings({ trainingPhase: "calibration", phaseStartedAt: new Date().toISOString() });
    setDismissed(true);
  }

  return (
    <Card className="border-accent/30">
      <div className="text-sm font-semibold">Welcome back</div>
      <p className="mt-1 text-sm text-text-muted">{prompt.message}</p>
      <div className="mt-3 flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => setDismissed(true)}>
          Resume normally
        </Button>
        <Button variant="secondary" className="flex-1" onClick={chooseLighterRestart}>
          Lighter restart
        </Button>
      </div>
    </Card>
  );
}
