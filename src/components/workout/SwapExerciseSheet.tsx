"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { Check } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { getAlternatives, getAvailableEquipmentKeys, isExerciseAvailable } from "@/lib/db/repo/exercises";
import type { Exercise } from "@/types/domain";

interface SwapExerciseSheetProps {
  open: boolean;
  onClose: () => void;
  originalExercise: Exercise;
  currentExerciseId: string;
  onSelect: (exerciseId: string) => void;
}

export function SwapExerciseSheet({ open, onClose, originalExercise, currentExerciseId, onSelect }: SwapExerciseSheetProps) {
  const data = useLiveQuery(async () => {
    const [alternatives, available] = await Promise.all([getAlternatives(originalExercise), getAvailableEquipmentKeys()]);
    return { alternatives, available };
  }, [originalExercise.id]);

  const options: Exercise[] = data ? [originalExercise, ...data.alternatives] : [originalExercise];

  return (
    <BottomSheet open={open} onClose={onClose} title="Swap Exercise">
      <div className="space-y-2 pb-4">
        {options.map((opt) => {
          const available = data ? isExerciseAvailable(opt, data.available) : true;
          const selected = opt.id === currentExerciseId;
          return (
            <button
              key={opt.id}
              disabled={!available}
              onClick={() => {
                onSelect(opt.id);
                onClose();
              }}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left ${
                selected ? "border-accent bg-accent/10" : "border-border bg-surface-2"
              } ${!available ? "opacity-40" : "active:brightness-90"}`}
            >
              <div>
                <div className="font-medium">{opt.name}</div>
                {!available && <div className="text-xs text-danger">Equipment not available</div>}
              </div>
              {selected && <Check size={18} className="text-accent" />}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
