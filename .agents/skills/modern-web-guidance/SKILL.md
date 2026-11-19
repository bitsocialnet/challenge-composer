---
name: modern-web-guidance
description: Look up browser support and implementation guidance when choosing native controls, keyboard focus, browser storage, or browser-sensitive layout.
---

From the project root, use the CLI pinned in the lockfile. Search for the browser behavior, then retrieve the matching guide by its returned ID.

```sh
DISABLE_TELEMETRY=1 npm exec --no -- modern-web-guidance search "dialog focus return"
DISABLE_TELEMETRY=1 npm exec --no -- modern-web-guidance retrieve dialog
```

Apply the relevant guidance to the affected component. Preserve the single-file build and verify the behavior by opening the rebuilt `dist/index.html` directly in a browser.
