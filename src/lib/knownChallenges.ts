export const KNOWN_CHALLENGE_NAMES = [
  "fail",
  "captcha-canvas-v3",
  "text-math",
  "evm-contract-call",
  "mintpass"
] as const;

export type KnownChallengeName = (typeof KNOWN_CHALLENGE_NAMES)[number];

// pkc-js ships these challenges in its runtime; no `challenge install` required.
export const PKC_BUILTIN_CHALLENGE_NAMES = [
  "blacklist",
  "fail",
  "publication-match",
  "question",
  "text-math",
  "whitelist"
] as const;

export function isBuiltinChallenge(name: string | undefined): boolean {
  if (!name) return false;
  return (PKC_BUILTIN_CHALLENGE_NAMES as readonly string[]).includes(name);
}

// Challenge `name` → npm package that registers it. Used by the CLI export to
// emit `bitsocial challenge install …` lines. Anything not listed here falls
// back to the challenge's `path` field (or shows a `<UNKNOWN_PACKAGE>` stub).
export const CHALLENGE_PACKAGE_MAP: Record<string, string> = {
  "captcha-canvas-v3": "@bitsocial/captcha-canvas-challenge",
  "evm-contract-call": "@bitsocial/evm-contract-challenge",
  mintpass: "@bitsocial/mintpass-challenge"
};

export interface ChallengeOptionHint {
  option: string;
  label: string;
  default?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
}

export const OPTION_HINTS: Record<KnownChallengeName, ChallengeOptionHint[]> = {
  fail: [
    { option: "error", label: "Error message", default: "This challenge always fails.", description: "Message shown to the user when they hit this gate." }
  ],
  "captcha-canvas-v3": [
    { option: "characters", label: "Characters", default: "6", description: "Number of characters in the captcha." },
    { option: "width", label: "Width", default: "300", description: "Image width in pixels." },
    { option: "height", label: "Height", default: "100", description: "Image height in pixels." },
    { option: "color", label: "Text color", description: "Text colour hex code." }
  ],
  "text-math": [
    { option: "difficulty", label: "Difficulty", default: "1", description: "Difficulty of the math problem (1-3)." }
  ],
  "evm-contract-call": [
    { option: "chainTicker", label: "Chain ticker", default: "eth", description: "e.g. eth, matic, avax." },
    { option: "address", label: "Contract address", required: true, description: "EVM contract address to call." },
    { option: "abi", label: "Function ABI (JSON)", required: true, description: "JSON ABI of the function to call (e.g. balanceOf)." },
    { option: "condition", label: "Condition", description: "e.g. >0, ==1, >=42. Expression applied to the return value." },
    { option: "error", label: "Error message", description: "Shown when the call fails the condition." }
  ],
  mintpass: [
    { option: "chainTicker", label: "Chain ticker", default: "base", description: "Chain where the Mintpass contract lives." },
    { option: "contractAddress", label: "Contract address", required: true, description: "Mintpass contract address." },
    { option: "requiredTokenType", label: "Required token type", default: "0", description: "Numeric token type id required to pass." },
    { option: "transferCooldownSeconds", label: "Transfer cooldown (s)", default: "604800", description: "Block addresses that received a token within N seconds." },
    { option: "error", label: "Error message", description: "Shown when the user doesn't have a valid token." }
  ]
};

export function hintsForChallenge(name: string | undefined): ChallengeOptionHint[] {
  if (!name) return [];
  return OPTION_HINTS[name as KnownChallengeName] ?? [];
}
