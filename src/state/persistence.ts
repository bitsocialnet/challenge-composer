import type { ChallengeSettings } from "../types/challenges.ts";
import { decodeShareHash } from "../lib/share.ts";

export const STORAGE_KEY = "challenge-composer:draft";

export function saveDraft(settings: ChallengeSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* storage may be unavailable (quota / disabled); ignore */
  }
}

export function loadDraft(): ChallengeSettings | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return undefined;
    return parsed as ChallengeSettings;
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

export function hydrateInitialState(): ChallengeSettings {
  if (typeof window !== "undefined" && window.location.hash) {
    const fromHash = decodeShareHash(window.location.hash);
    if (fromHash) return fromHash;
  }
  const fromStorage = loadDraft();
  if (fromStorage) return fromStorage;
  return [];
}
