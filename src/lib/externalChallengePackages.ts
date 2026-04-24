// npm packages outside pkc-js that the composer knows about. Each listed package
// must export a default `ChallengeFileFactory` compatible with pkc-js. The Vite
// plugin imports each one at build time, calls the factory with empty settings,
// and bakes the resulting `optionInputs` / `description` / `type` into the bundle.
//
// Managed by scripts/refresh-external-challenges.mjs: it scans the bitsocialnet
// GitHub org for repos ending in `-challenge`, verifies each is a pkc-js
// challenge (has @pkcprotocol/pkc-js in deps), and rewrites this file + the
// matching devDependencies in package.json.
export const EXTERNAL_CHALLENGE_PACKAGES = [
  "@bitsocial/ai-moderation-challenge",
  "@bitsocial/captcha-canvas-challenge",
  "@bitsocial/evm-contract-challenge",
  "@bitsocial/voucher-challenge"
] as const;

export type ExternalChallengePackage = (typeof EXTERNAL_CHALLENGE_PACKAGES)[number];
