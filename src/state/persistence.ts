import type { ChallengeSettings } from "../types/challenges.ts";
import { decodeShareHash, isShareHash, toEditableSettings } from "../lib/share.ts";

export const STORAGE_KEY = "challenge-composer:draft";

// Returns whether the draft was stored.
export function saveDraft(settings: ChallengeSettings): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch {
    /* storage may be unavailable (quota / disabled); ignore */
    return false;
  }
}

export function loadDraft(): ChallengeSettings | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    return toEditableSettings(JSON.parse(raw) as unknown);
  } catch {
    return undefined;
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// A `#s=` fragment is a one-shot import: once the settings change, the saved draft is newer than the
// fragment, and leaving it in place would make the next reload bring back the shared settings.
// Call it only after saveDraft succeeded: without a stored draft, the fragment is all a reload has.
export function clearShareHash(): void {
  if (typeof window === "undefined" || !isShareHash(window.location.hash)) return;
  try {
    window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
  } catch {
    window.location.replace("#");
  }
}

export function hydrateInitialState(): ChallengeSettings {
  if (typeof window !== "undefined" && window.location.hash) {
    const fromHash = decodeShareHash(window.location.hash);
    if (fromHash) return fromHash;
  }
  const fromStorage = loadDraft();
  if (fromStorage) return fromStorage;
  return [];
}
