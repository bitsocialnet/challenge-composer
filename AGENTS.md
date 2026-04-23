# challenge-composer

## Setup

This project ships as a **single self-contained HTML file**. There is no dev server, no hosted URL, and no runtime dependencies — just one file you open in a browser.

```sh
npm install
npm run build
```

The build emits `dist/index.html` with all JS and CSS inlined. Open it directly:

```sh
xdg-open dist/index.html   # or just double-click it
```

It works from `file://` — no server required. Drop the file anywhere (USB stick, email attachment, static host) and it runs.

State (drafts, share links) lives in `localStorage` of whichever origin you open it from.

## Notes for agents

- Do **not** start a dev server (`npm run dev`, `vite`, etc.). The only supported workflow is `npm run build` → open `dist/index.html`.
- `vite-plugin-singlefile` inlines everything; do not add external `<script src>` / `<link href>` references, and do not split chunks — it defeats the single-file guarantee.
- `npm test` and `npm run typecheck` remain the verification commands.
