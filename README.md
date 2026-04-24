# challenge-composer

A standalone, offline-first web app for **visualizing and editing** the `challenges` array of a PKC community's `settings` (pkc-js format). Inspired by the challenges section of seedit's community-settings view.

- Ships as **one self-contained `dist/index.html`** with every JS/CSS chunk inlined by `vite-plugin-singlefile`. Drop it anywhere — USB stick, email attachment, static host — and open from `file://`.
- Zero outward HTTP at runtime. Everything works from the bundled app and user-supplied data.
- Fully typed, ESM, Node ≥22, Vitest for tests.

## Requirements

- Node **22+**
- npm 10+

## Getting started

```sh
npm ci             # install pinned exact versions
npm run build      # type-check + emit dist/index.html (everything inlined)
xdg-open dist/index.html   # or just double-click it
```

Supporting scripts: `npm test` (Vitest + happy-dom), `npm run typecheck`, `npm run preview` (serves `dist/` locally for a smoke test).

The current `package.json` version is injected into the bundle via Vite's `define` as `__APP_VERSION__` and rendered next to the header title, so whoever opens `dist/index.html` can see which release it came from.

## Release flow

Versioning is automated. Conventional commits (`feat:`, `fix:`, `perf:`, `build:`, `revert:`) on `master` trigger a release:

1. The **CI** workflow (`.github/workflows/ci.yml`) runs typecheck, tests, and build on every push/PR.
2. The **Release and deploy** workflow (`.github/workflows/deploy.yml`) runs on successful CI completion on `master`: it invokes `release-it` (config in `config/.release-it.json`) which bumps the version, updates `CHANGELOG.md`, commits `chore(release): X.Y.Z [skip ci]`, tags `vX.Y.Z`, and cuts a GitHub release. It then rebuilds `dist/index.html` with the new version embedded and publishes it to GitHub Pages.

The repo ships a commit-msg hook (`.githooks/commit-msg`, installed by `scripts/install-git-hooks.mjs`) that runs `commitlint` on the message so non-conventional commits are caught before they reach master. `git cz` via `commitizen` is wired up as an interactive alternative.

State (drafts, share links) lives in `localStorage` of whichever origin you open it from.

## What it edits

A JSON array of `CommunityChallengeSetting`, the same shape pkc-js accepts in `community.settings.challenges`. Each entry:

```jsonc
{
  "name": "text-math",                // pkc-js built-in challenge identifier, OR
  "path": "./my-challenge.js",        // path to a custom challenge module (one of the two)
  "description": "Solve to post.",
  "pendingApproval": true,            // mods must approve after the user solves
  "options": {                        // all values must be strings
    "difficulty": "2"
  },
  "exclude": [                        // any matching group lets the author bypass
    { "role": ["moderator", "admin", "owner"] },
    { "postCount": 10, "firstCommentTimestamp": 604800, "rateLimit": 3, "rateLimitChallengeSuccess": true },
    { "publicationType": { "reply": true } }
  ]
}
```

### Challenges shipped with pkc-js

A challenge name is "built-in" iff it is a key of `PKC.challenges` (= `pkcJsChallenges`) in `@pkcprotocol/pkc-js` — these resolve by `name` without any install step on the community node. The list is extracted at build time by the `pkcBuiltinNamesPlugin` Vite plugin (see `vite.config.ts`) and exposed to the app as `PKC_BUILTIN_CHALLENGE_NAMES` in `src/lib/knownChallenges.ts`, so adding or removing a built-in in pkc-js propagates on next rebuild without any manual edits here.

Anything not in that list — `captcha-canvas-v3`, `evm-contract-call`, `mintpass`, … — is an **external** challenge that the community operator must install on their node separately, e.g. `bitsocial challenge install @bitsocial/captcha-canvas-challenge`. The **Export CLI** button uses the same `PKC.challenges` list (via `isBuiltinChallenge`) to decide which names need a `challenge install` line prepended.

### Validation

`CommunityChallengeSettingSchema` is imported directly from `@pkcprotocol/pkc-js` at runtime (via a Vite alias around its internal subpath) — no local mirror, so the schema cannot drift from upstream. See `src/pkc-schema.ts` and the `@pkc/*` aliases in `vite.config.ts`.

## Features

- **Seedit-style editor**: add/remove/reorder challenges, edit name/path/options/description/pendingApproval, manage exclude rules (roles, post/reply counts, account age, rate limit, publication type, author addresses).
- **Presets dropdown**: ships with `5chan board defaults`, `captcha only`, and `empty`.
- **Paste JSONC** dialog, **file upload** (`.json` / `.jsonc`), and **download** as `challenges.jsonc`.
- **Export CLI**: emits a `bitsocial challenge install …` + `bitsocial community edit …` shell script tailored to the current settings, flagging unknown challenge names with a TODO for the operator.
- **Live JSON preview** with inline zod validation errors.
- **LocalStorage draft** auto-saves every change.
- **Share URL**: compresses the current settings into a URL fragment (`#s=…`). Browsers never send fragments to servers, so the blob stays client-side — but anyone holding the URL can decode it verbatim. A warning dialog makes this explicit before you copy.

## Security notes

- The Share URL contains your full settings in lz-string-compressed but not encrypted form. Treat it like pasting the raw JSONC into a public place.
- The `?raw` preset imports are bundled at build time. The runtime bundle performs no `fetch()` calls to third-party hosts.

## Architecture

```
src/
├── pkc-schema.ts                     # re-exports CommunityChallengeSettingSchema via vite alias
├── types/challenges.ts               # type-only re-exports from @pkcprotocol/pkc-js
├── state/                            # useReducer store + localStorage/hash hydration
├── lib/                              # jsonc, share (lz-string), cliExport, known-challenges catalog
├── presets/                          # bundled .jsonc presets + registry
└── components/                       # Header, ChallengesEditor, ChallengeCard, ChallengeRow,
                                      # OptionsEditor, ExcludeRulesEditor, JsonPreview,
                                      # ImportDialog, ShareDialog, ExportCliDialog
```

## TODO

- **Scenario simulator.** For each challenge in the current settings, simulate which publications and author profiles would be challenged vs. excluded, across a library of mock authors (brand-new account, moderator, high-karma user, rate-limited user, wallet holder, banned author address, …). Should exercise every branch of `ChallengeExcludeSchema` — role / postCount / replyCount / postScore / replyScore / firstCommentTimestamp / rateLimit / rateLimitChallengeSuccess / publicationType / address / community / challenges.
- Inline zod validation errors attached to the specific offending field (currently shown in the JSON preview panel only).
- Drag-and-drop reordering for challenges (the reducer has `MOVE_CHALLENGE` and Move up/down buttons; drag handles are not yet wired up).
