import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import type { ChallengeSettings } from "../types/challenges.ts";

const HASH_PREFIX = "s=";

export function encodeShareHash(settings: ChallengeSettings): string {
  return HASH_PREFIX + compressToEncodedURIComponent(JSON.stringify(settings));
}

export function decodeShareHash(hash: string): ChallengeSettings | undefined {
  const trimmed = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!trimmed.startsWith(HASH_PREFIX)) return undefined;
  const payload = trimmed.slice(HASH_PREFIX.length);
  if (!payload) return undefined;
  const decompressed = decompressFromEncodedURIComponent(payload);
  if (!decompressed) return undefined;
  try {
    const parsed = JSON.parse(decompressed) as unknown;
    if (!Array.isArray(parsed)) return undefined;
    return parsed as ChallengeSettings;
  } catch {
    return undefined;
  }
}

export function buildShareUrl(settings: ChallengeSettings, base?: string): string {
  const origin = base ?? (typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}` : "");
  return `${origin}#${encodeShareHash(settings)}`;
}
