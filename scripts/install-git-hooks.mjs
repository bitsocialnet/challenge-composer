#!/usr/bin/env node
// Install tracked hooks from .githooks/ into .git/hooks/ without clobbering
// existing unrelated hooks (e.g. a user-installed post-commit). Run by the
// `prepare` npm script so `npm install` keeps the push-time checks in sync.
//
// Skips silently outside a git checkout (e.g. `npm install` from a tarball or
// CI caches) so it never breaks consumers.

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, chmodSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(ROOT, ".githooks");
const TARGET = join(ROOT, ".git", "hooks");
const MARKER = "# challenge-composer tracked hook";

if (!existsSync(join(ROOT, ".git"))) {
  // Not a git checkout — e.g. installed from a tarball. Nothing to do.
  process.exit(0);
}
if (!existsSync(SOURCE)) process.exit(0);
if (!existsSync(TARGET)) mkdirSync(TARGET, { recursive: true });

for (const name of readdirSync(SOURCE)) {
  const from = join(SOURCE, name);
  const to = join(TARGET, name);
  const next = readFileSync(from, "utf8");

  // Only replace hooks we previously wrote (marker line present) or empty
  // slots. Hand-written hooks without our marker are left alone so devs can
  // keep personal customisations.
  if (existsSync(to)) {
    const current = readFileSync(to, "utf8");
    if (!current.includes(MARKER)) {
      console.warn(`install-git-hooks: .git/hooks/${name} exists without marker — leaving alone`);
      continue;
    }
    if (current === withMarker(next)) continue;
  }

  writeFileSync(to, withMarker(next));
  chmodSync(to, 0o755);
  console.log(`install-git-hooks: wrote .git/hooks/${name}`);
}

function withMarker(body) {
  // Insert marker right after the shebang so future runs recognise the file.
  const lines = body.split("\n");
  if (lines[0]?.startsWith("#!")) {
    return [lines[0], MARKER, ...lines.slice(1)].join("\n");
  }
  return `${MARKER}\n${body}`;
}
