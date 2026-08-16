"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function ActiveSessionBanner({ label }: { label: string }) {
  const router = useRouter();
  return (
    <Card className="border-accent/40 bg-accent/10">
      <div className="text-sm font-semibold text-accent">Workout in progress</div>
      <div className="mt-0.5 text-sm text-text-muted">{label} — pick up where you left off.</div>
      <Button className="mt-3" fullWidth onClick={() => router.push("/workout/active")}>
        Resume Workout
      </Button>
    </Card>
  );
}
