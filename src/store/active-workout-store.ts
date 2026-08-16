import { create } from "zustand";

interface RestTimerState {
  running: boolean;
  endAt: number | null; // epoch ms
  totalSec: number;
}

interface ActiveWorkoutStore {
  currentExerciseIndex: number;
  restTimer: RestTimerState;
  setCurrentExerciseIndex: (i: number) => void;
  startRest: (seconds: number) => void;
  pauseRest: () => void;
  resumeRest: () => void;
  adjustRest: (deltaSeconds: number) => void;
  skipRest: () => void;
  resetForNewSession: () => void;
}

const idleTimer: RestTimerState = { running: false, endAt: null, totalSec: 0 };

export const useActiveWorkoutStore = create<ActiveWorkoutStore>((set, get) => ({
  currentExerciseIndex: 0,
  restTimer: idleTimer,

  setCurrentExerciseIndex: (i) => set({ currentExerciseIndex: i }),

  startRest: (seconds) =>
    set({ restTimer: { running: true, endAt: Date.now() + seconds * 1000, totalSec: seconds } }),

  pauseRest: () => {
    const { restTimer } = get();
    if (!restTimer.running || restTimer.endAt == null) return;
    const remaining = Math.max(0, Math.round((restTimer.endAt - Date.now()) / 1000));
    set({ restTimer: { running: false, endAt: null, totalSec: remaining } });
  },

  resumeRest: () => {
    const { restTimer } = get();
    if (restTimer.running) return;
    set({ restTimer: { running: true, endAt: Date.now() + restTimer.totalSec * 1000, totalSec: restTimer.totalSec } });
  },

  adjustRest: (deltaSeconds) => {
    const { restTimer } = get();
    if (restTimer.running && restTimer.endAt != null) {
      set({ restTimer: { ...restTimer, endAt: restTimer.endAt + deltaSeconds * 1000 } });
    } else {
      set({ restTimer: { ...restTimer, totalSec: Math.max(0, restTimer.totalSec + deltaSeconds) } });
    }
  },

  skipRest: () => set({ restTimer: idleTimer }),

  resetForNewSession: () => set({ currentExerciseIndex: 0, restTimer: idleTimer }),
}));
