let sentinel: WakeLockSentinel | null = null;

export async function acquireWakeLock(): Promise<void> {
  if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
  try {
    sentinel = await navigator.wakeLock.request("screen");
  } catch {
    // Ignore — e.g. document not visible yet. Not critical to the workout flow.
  }
}

export async function releaseWakeLock(): Promise<void> {
  if (sentinel) {
    try {
      await sentinel.release();
    } catch {
      // already released
    }
    sentinel = null;
  }
}

export function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}
