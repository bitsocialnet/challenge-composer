import type { ChallengeSettings } from "../types/challenges.ts";
import { CHALLENGE_PACKAGE_MAP, isBuiltinChallenge } from "./knownChallenges.ts";
import { stringifyJson } from "./jsonc.ts";

export interface CliExportOptions {
  address: string;
  jsonPath?: string;
}

export interface InstallTarget {
  name: string;
  package: string;
  /** true when we don't have a confident package mapping and fell back to a placeholder. */
  guessed: boolean;
}

const DEFAULT_ADDRESS_PLACEHOLDER = "<your-community.bso>";
const DEFAULT_JSON_PATH = "./community-edit.json";
const UNKNOWN_PACKAGE_PLACEHOLDER = "<npm-package-name>";

export function collectInstallTargets(settings: ChallengeSettings): InstallTarget[] {
  const seen = new Map<string, InstallTarget>();
  for (const c of settings) {
    if (c.path) {
      // `path` can be a local path, npm specifier, git URL, tarball URL — pass through.
      const key = `path:${c.path}`;
      if (!seen.has(key)) seen.set(key, { name: c.name ?? c.path, package: c.path, guessed: false });
      continue;
    }
    if (!c.name || isBuiltinChallenge(c.name)) continue;
    const pkg = CHALLENGE_PACKAGE_MAP[c.name];
    const key = `name:${c.name}`;
    if (seen.has(key)) continue;
    if (pkg) {
      seen.set(key, { name: c.name, package: pkg, guessed: false });
    } else {
      seen.set(key, { name: c.name, package: UNKNOWN_PACKAGE_PLACEHOLDER, guessed: true });
    }
  }
  return [...seen.values()];
}

function buildEditPayload(settings: ChallengeSettings): unknown {
  return { settings: { challenges: settings } };
}

export interface CliExportResult {
  script: string;
  installTargets: InstallTarget[];
  jsonPath: string;
  address: string;
}

export function buildCliExport(
  settings: ChallengeSettings,
  options: CliExportOptions = { address: DEFAULT_ADDRESS_PLACEHOLDER }
): CliExportResult {
  const address = options.address?.trim() || DEFAULT_ADDRESS_PLACEHOLDER;
  const jsonPath = options.jsonPath?.trim() || DEFAULT_JSON_PATH;
  const installTargets = collectInstallTargets(settings);
  const payload = buildEditPayload(settings);
  const jsonBody = stringifyJson(payload).trimEnd();

  const lines: string[] = [];
  lines.push("#!/usr/bin/env bash");
  lines.push("set -euo pipefail");
  lines.push("");

  if (installTargets.length) {
    lines.push("# 1. Install challenge packages referenced by these settings");
    for (const t of installTargets) {
      const comment = t.guessed ? `  # TODO: replace with the package that provides "${t.name}"` : "";
      lines.push(`bitsocial challenge install ${t.package}${comment}`);
    }
    lines.push("");
  }

  const stepNum = installTargets.length ? 2 : 1;
  lines.push(`# ${stepNum}. Write the challenge settings to ${jsonPath}`);
  lines.push(`cat > ${jsonPath} <<'JSON'`);
  lines.push(jsonBody);
  lines.push("JSON");
  lines.push("");

  lines.push(`# ${stepNum + 1}. Apply the settings to your community`);
  lines.push(`bitsocial community edit ${address} --jsonFile ${jsonPath}`);
  lines.push("");

  return {
    script: lines.join("\n"),
    installTargets,
    jsonPath,
    address
  };
}
