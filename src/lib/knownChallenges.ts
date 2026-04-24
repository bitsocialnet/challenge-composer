import {
  BUILTIN_CHALLENGES,
  EXTERNAL_CHALLENGES,
  type ChallengeMetadata,
  type OptionInput
} from "virtual:challenge-metadata";

export { BUILTIN_CHALLENGES, EXTERNAL_CHALLENGES };
export type { ChallengeMetadata, OptionInput };

// Structurally identical to OptionInput; kept as a named re-export so existing
// callers that import ChallengeOptionHint don't break.
export type ChallengeOptionHint = OptionInput;

export const BUILTIN_CHALLENGE_NAMES: ReadonlyArray<string> = BUILTIN_CHALLENGES.map((c) => c.name);

// Derived name → npm package map used by the CLI export to emit
// `bitsocial challenge install <pkg>` lines. Built from EXTERNAL_CHALLENGES;
// no hand-maintained entries.
export const CHALLENGE_PACKAGE_MAP: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(
    EXTERNAL_CHALLENGES.filter((c) => c.packageName).map((c) => [c.name, c.packageName!])
  )
);

// Path → metadata lookup, so OptionsEditor can resolve hints when the user
// selects an external challenge (which sets `path`, not `name`).
const EXTERNAL_BY_PACKAGE: ReadonlyMap<string, ChallengeMetadata> = new Map(
  EXTERNAL_CHALLENGES.filter((c) => c.packageName).map((c) => [c.packageName!, c])
);

const BUILTIN_BY_NAME: ReadonlyMap<string, ChallengeMetadata> = new Map(
  BUILTIN_CHALLENGES.map((c) => [c.name, c])
);

export function isBuiltinChallenge(name: string | undefined): boolean {
  if (!name) return false;
  return BUILTIN_BY_NAME.has(name);
}

export interface ChallengeIdentifier {
  name?: string;
  path?: string;
}

export function findChallengeMetadata(challenge: ChallengeIdentifier): ChallengeMetadata | undefined {
  if (challenge.path) {
    const byPath = EXTERNAL_BY_PACKAGE.get(challenge.path);
    if (byPath) return byPath;
  }
  if (challenge.name) {
    return BUILTIN_BY_NAME.get(challenge.name);
  }
  return undefined;
}

export function hintsForChallenge(challenge: ChallengeIdentifier | string | undefined): ReadonlyArray<ChallengeOptionHint> {
  if (!challenge) return [];
  const id: ChallengeIdentifier = typeof challenge === "string" ? { name: challenge } : challenge;
  return findChallengeMetadata(id)?.optionInputs ?? [];
}
