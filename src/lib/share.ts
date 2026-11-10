import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import type { ChallengeSettings } from "../types/challenges.ts";
import { CommunityChallengeSettingSchema } from "../pkc-schema.ts";

const HASH_PREFIX = "s=";

const ChallengeSettingsArraySchema = CommunityChallengeSettingSchema.array();

// Share links and saved drafts can hold settings that are still being edited and do not pass the
// pkc-js schema yet (a challenge without name or path, a community rule without addresses), so a
// failed parse alone is not a reason to drop them. A type mismatch (`[null]`, `exclude: {}`) is:
// the editor cannot render it and would blank the page on every load. Role entries are a union
// (known role name or any string), so a wrong-typed role (`role: [{}]`) reports `invalid_union`.
export function toEditableSettings(value: unknown): ChallengeSettings | undefined {
  const result = ChallengeSettingsArraySchema.safeParse(value);
  if (!result.success && result.error.issues.some((issue) => issue.code === "invalid_type" || issue.code === "invalid_union")) {
    return undefined;
  }
  return value as ChallengeSettings;
}

export function isShareHash(hash: string): boolean {
  return (hash.startsWith("#") ? hash.slice(1) : hash).startsWith(HASH_PREFIX);
}

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
    return toEditableSettings(JSON.parse(decompressed) as unknown);
  } catch {
    return undefined;
  }
}

export function buildShareUrl(settings: ChallengeSettings, base?: string): string {
  const origin = base ?? (typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}` : "");
  return `${origin}#${encodeShareHash(settings)}`;
}
