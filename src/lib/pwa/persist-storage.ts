/**
 * Asks the browser to mark this origin's storage as "persistent" — it will not be
 * silently evicted under storage pressure the way regular ("best-effort") storage can be.
 * Safe no-op on browsers that don't support the API. Doesn't guarantee anything by itself
 * (the browser can still refuse), but there's no downside to asking.
 */
export async function requestPersistentStorage(): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) return;
  try {
    const already = await navigator.storage.persisted?.();
    if (already) return;
    await navigator.storage.persist();
  } catch {
    // Not critical — the app works the same either way, this is just a hint to the browser.
  }
}
