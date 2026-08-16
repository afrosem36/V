"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { askCoach } from "@/lib/groq/askCoach";
import type { Exercise } from "@/types/domain";

interface ExerciseInfoSheetProps {
  exercise: Exercise | null;
  onClose: () => void;
}

export function ExerciseInfoSheet({ exercise, onClose }: ExerciseInfoSheetProps) {
  const [aiText, setAiText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function askAI() {
    if (!exercise || loading) return;
    setLoading(true);
    try {
      const result = await askCoach({
        type: "explain",
        exerciseName: exercise.name,
        primaryMuscle: exercise.primaryMuscle,
        equipment: exercise.equipment,
      });
      setAiText(result ?? "AI coach is unavailable right now — the guidance above still applies.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <BottomSheet open={exercise != null} onClose={onClose} title={exercise?.name}>
      {exercise && (
        <div className="space-y-4 pb-4 text-sm">
          <p className="text-text-muted">{exercise.instructions}</p>

          <div>
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">Form cues</div>
            <ul className="list-disc space-y-1 pl-4">
              {exercise.formCues.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">Common mistakes</div>
            <ul className="list-disc space-y-1 pl-4 text-text-muted">
              {exercise.commonMistakes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
            <div className="rounded-lg bg-surface-2 p-2.5">
              <div className="text-text-muted">Rep range</div>
              <div className="font-semibold">
                {exercise.repRangeMin}–{exercise.repRangeMax} {exercise.repUnit}
              </div>
            </div>
            <div className="rounded-lg bg-surface-2 p-2.5">
              <div className="text-text-muted">Rest</div>
              <div className="font-semibold">{Math.round(exercise.restSeconds / 15) * 15}s</div>
            </div>
          </div>

          {aiText ? (
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-accent">
                <Sparkles size={13} />
                AI Coach
              </div>
              <p className="text-text-muted">{aiText}</p>
            </div>
          ) : (
            <button
              onClick={askAI}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-medium text-accent disabled:opacity-40"
            >
              <Sparkles size={13} />
              {loading ? "Asking AI…" : "Ask AI to explain this exercise"}
            </button>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
