#!/usr/bin/env node
// Scan a GitHub org for `*-challenge` repos that are pkc-js challenge packages,
// and sync two files to match:
//   - src/lib/externalChallengePackages.ts  (the list the Vite plugin reads)
//   - package.json devDependencies          (so the packages are installable)
//
// Usage:
//   node scripts/refresh-external-challenges.mjs              # uses `gh` CLI
//   GITHUB_TOKEN=ghp_xxx node scripts/refresh-external-challenges.mjs
//   ORG=otherorg node scripts/refresh-external-challenges.mjs
//
// Requires either:
//   - the `gh` CLI authenticated to the target org, OR
//   - a GITHUB_TOKEN env var with read:org + public_repo scope.
//
// After running, review the diff and `npm install` to pull the new deps.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

const ORG = process.env.ORG || "bitsocialnet";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LIST_FILE = join(ROOT, "src/lib/externalChallengePackages.ts");
const PKG_FILE = join(ROOT, "package.json");

const USE_GH_CLI = !process.env.GITHUB_TOKEN;

function ghApi(pathWithQuery) {
  if (USE_GH_CLI) {
    const res = spawnSync("gh", ["api", pathWithQuery], { encoding: "utf8" });
    if (res.status !== 0) {
      throw new Error(`gh api ${pathWithQuery} failed: ${res.stderr}`);
    }
    return JSON.parse(res.stdout);
  }
  // Node ≥22 has global fetch; this is sync-style via await.
  throw new Error("non-gh-cli path uses fetch; call via listOrgReposViaFetch()");
}

async function listOrgRepos(org) {
  if (USE_GH_CLI) {
    // `gh api --paginate` handles pagination for us.
    const res = spawnSync(
      "gh",
      ["api", "--paginate", `orgs/${org}/repos`, "--jq", ".[] | {name, archived}"],
      { encoding: "utf8" }
    );
    if (res.status !== 0) throw new Error(`gh api failed: ${res.stderr}`);
    return res.stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  }
  const repos = [];
  for (let page = 1; page < 20; page += 1) {
    const r = await fetch(`https://api.github.com/orgs/${org}/repos?per_page=100&page=${page}`, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json"
      }
    });
    if (!r.ok) throw new Error(`GitHub API ${r.status}: ${await r.text()}`);
    const batch = await r.json();
    if (batch.length === 0) break;
    repos.push(...batch.map((x) => ({ name: x.name, archived: x.archived })));
    if (batch.length < 100) break;
  }
  return repos;
}

async function fetchPackageJson(org, repo) {
  if (USE_GH_CLI) {
    const res = spawnSync(
      "gh",
      ["api", `repos/${org}/${repo}/contents/package.json`, "--jq", ".content"],
      { encoding: "utf8" }
    );
    if (res.status !== 0) return null;
    const b64 = res.stdout.trim().replace(/\n/g, "");
    if (!b64) return null;
    try {
      return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    } catch {
      return null;
    }
  }
  const r = await fetch(`https://api.github.com/repos/${org}/${repo}/contents/package.json`, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json"
    }
  });
  if (!r.ok) return null;
  const body = await r.json();
  try {
    return JSON.parse(Buffer.from(body.content, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function isPkcJsChallenge(pkg) {
  if (!pkg || typeof pkg !== "object") return false;
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  return Object.prototype.hasOwnProperty.call(deps, "@pkcprotocol/pkc-js");
}

function rewriteList(packages) {
  const header = `// npm packages outside pkc-js that the composer knows about. Each listed package
// must export a default \`ChallengeFileFactory\` compatible with pkc-js. The Vite
// plugin imports each one at build time, calls the factory with empty settings,
// and bakes the resulting \`optionInputs\` / \`description\` / \`type\` into the bundle.
//
// Managed by scripts/refresh-external-challenges.mjs: it scans the bitsocialnet
// GitHub org for repos ending in \`-challenge\`, verifies each is a pkc-js
// challenge (has @pkcprotocol/pkc-js in deps), and rewrites this file + the
// matching devDependencies in package.json.
export const EXTERNAL_CHALLENGE_PACKAGES = [
`;
  const body = packages
    .slice()
    .sort()
    .map((p) => `  ${JSON.stringify(p)}`)
    .join(",\n");
  const footer = `
] as const;

export type ExternalChallengePackage = (typeof EXTERNAL_CHALLENGE_PACKAGES)[number];
`;
  writeFileSync(LIST_FILE, `${header}${body}${footer}`);
}

function rewritePackageJson(versionByPackage) {
  const raw = readFileSync(PKG_FILE, "utf8");
  const pkg = JSON.parse(raw);
  const dev = { ...(pkg.devDependencies ?? {}) };
  // Drop stale @bitsocial/*-challenge entries, then add back the fresh ones.
  for (const key of Object.keys(dev)) {
    if (/^@bitsocial\/.*-challenge$/.test(key)) delete dev[key];
  }
  for (const [name, version] of Object.entries(versionByPackage)) {
    dev[name] = version;
  }
  pkg.devDependencies = Object.fromEntries(Object.entries(dev).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(PKG_FILE, JSON.stringify(pkg, null, 2) + "\n");
}

async function main() {
  console.log(`Scanning ${ORG} for *-challenge repos…`);
  const repos = await listOrgRepos(ORG);
  const candidates = repos.filter((r) => r.name.endsWith("-challenge") && !r.archived);
  console.log(`  found ${candidates.length} candidate repo(s): ${candidates.map((r) => r.name).join(", ")}`);

  const packages = [];
  const versionByPackage = {};
  for (const repo of candidates) {
    const pkg = await fetchPackageJson(ORG, repo.name);
    if (!pkg) {
      console.log(`  ${repo.name}: no package.json, skipping`);
      continue;
    }
    if (!isPkcJsChallenge(pkg)) {
      console.log(`  ${repo.name}: not a pkc-js challenge (missing @pkcprotocol/pkc-js dep), skipping`);
      continue;
    }
    if (!pkg.name) {
      console.log(`  ${repo.name}: package has no name field, skipping`);
      continue;
    }
    packages.push(pkg.name);
    // Pin to the current version the repo publishes.
    versionByPackage[pkg.name] = pkg.version ?? "latest";
    console.log(`  ${repo.name} -> ${pkg.name}@${pkg.version ?? "latest"}`);
  }

  if (packages.length === 0) {
    console.error("No pkc-js challenge packages found — refusing to wipe the list.");
    process.exit(1);
  }

  rewriteList(packages);
  rewritePackageJson(versionByPackage);
  console.log(`\nWrote ${packages.length} package(s) to ${LIST_FILE}`);
  console.log(`Updated devDependencies in ${PKG_FILE}`);
  console.log(`\nNext: run \`npm install\` and then \`npm run build\`.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
