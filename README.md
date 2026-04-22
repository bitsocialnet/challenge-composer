# challenge-composer

A standalone, offline-first web app for **visualizing and editing** the `challenges` array of a Plebbit community's `settings` (pkc-js format). Inspired by the challenges section of seedit's subplebbit-settings view.

- Zero outward HTTP at runtime — everything works from the bundled app and user-supplied data.
- Types-only dependency on [`@pkcprotocol/pkc-js`](https://www.npmjs.com/package/@pkcprotocol/pkc-js). The compiled app does not import the pkc-js runtime.
- Fully typed, ESM, Node ≥22, Vitest for tests.

## Requirements

- Node **22+**
- npm 10+

## Getting started

```bash
npm ci           # install pinned exact versions
npm run dev      # start the Vite dev server on http://localhost:5173
npm test         # run the Vitest suite (happy-dom)
npm run build    # type-check + produce a static bundle in dist/
npm run preview  # serve dist/ locally for a smoke test
```

## What it edits

A JSON array of `CommunityChallengeSetting`, the same shape pkc-js accepts in `community.settings.challenges`. Each entry:

```jsonc
{
  "name": "captcha-canvas-v3",        // built-in challenge identifier, OR
  "path": "./my-challenge.js",        // path to a custom challenge module (one of the two)
  "description": "Solve to post.",
  "pendingApproval": true,            // mods must approve after the user solves
  "options": {                        // all values must be strings
    "characters": "6",
    "width": "280"
  },
  "exclude": [                        // any matching group lets the author bypass
    { "role": ["moderator", "admin", "owner"] },
    { "postCount": 10, "firstCommentTimestamp": 604800, "rateLimit": 3, "rateLimitChallengeSuccess": true },
    { "publicationType": { "reply": true } }
  ]
}
```

Validation is done by a local zod schema mirroring `CommunityChallengeSettingSchema` in `pkc-js/src/community/schema.ts`. The compile-time assertion in `src/schema/challengeSettings.ts` guarantees the mirror stays structurally identical to the pkc-js type.

## Features

- **Seedit-style editor**: add/remove challenges, edit name/path/options/description/pendingApproval, manage exclude rules (roles, post/reply counts, account age, rate limit, publication type, author addresses).
- **Presets dropdown**: ships with `5chan board defaults`, `captcha only`, and `empty`.
- **Paste JSONC** dialog, **file upload** (`.json` / `.jsonc`), and **download** as `challenges.jsonc`.
- **Live JSON preview** with inline zod validation errors.
- **LocalStorage draft** auto-saves every change.
- **Share URL**: compresses the current settings into a URL fragment (`#s=…`). Browsers never send fragments to servers, so the blob stays client-side — but anyone holding the URL can decode it verbatim. A warning dialog makes this explicit before you copy.

## Security notes

- The Share URL contains your full settings in lz-string-compressed but not encrypted form. Treat it like pasting the raw JSONC into a public place.
- The `?raw` preset imports are bundled at build time. The runtime bundle performs no `fetch()` calls to third-party hosts.

## Architecture

```
src/
├── types/challenges.ts              # type-only re-exports from @pkcprotocol/pkc-js
├── schema/challengeSettings.ts      # local zod mirror of CommunityChallengeSettingSchema
├── state/                            # useReducer store + localStorage/hash hydration
├── lib/                              # jsonc, share (lz-string), known challenges catalog
├── presets/                          # bundled .jsonc presets + registry
└── components/                       # Header, ChallengesEditor, ChallengeCard,
                                      # OptionsEditor, ExcludeRulesEditor,
                                      # JsonPreview, ImportDialog, ShareDialog
```

## TODO

- **Scenario simulator.** For each challenge in the current settings, simulate which publications and author profiles would be challenged vs. excluded, across a library of mock authors (brand-new account, moderator, high-karma user, rate-limited user, wallet holder, banned author address, …). Should exercise every branch of `ChallengeExcludeSchema` — role / postCount / replyCount / postScore / replyScore / firstCommentTimestamp / rateLimit / rateLimitChallengeSuccess / publicationType / address / community / challenges.
- Inline zod validation errors attached to the specific offending field (currently shown in the JSON preview panel only).
- Drag-and-drop reordering for challenges (the reducer already has `MOVE_CHALLENGE`, the UI just doesn't expose it yet).
