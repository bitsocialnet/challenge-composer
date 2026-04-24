/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readdirSync } from "node:fs";
import path from "node:path";
import { EXTERNAL_CHALLENGE_PACKAGES } from "./src/lib/externalChallengePackages";

// pkc-js's community schema sits at an internal subpath (not exposed in its `exports`
// map), so we alias it directly — import, never mirror.
const pkcCommunitySchema = fileURLToPath(
  new URL("./node_modules/@pkcprotocol/pkc-js/dist/browser/community/schema.js", import.meta.url)
);
const pkcCommentSchema = fileURLToPath(
  new URL("./node_modules/@pkcprotocol/pkc-js/dist/browser/publications/comment/schema.js", import.meta.url)
);

// Directory holding the built-in pkc-js challenge factories. Each *.js file is a
// default-exported ChallengeFileFactory we can invoke to read its optionInputs.
const pkcBuiltinChallengesDir = fileURLToPath(
  new URL(
    "./node_modules/@pkcprotocol/pkc-js/dist/node/runtime/node/community/challenges/pkc-js-challenges/",
    import.meta.url
  )
);

interface OptionInput {
  option: string;
  label: string;
  default?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
}

interface ChallengeMetadata {
  name: string;
  packageName?: string;
  description?: string;
  type?: string;
  optionInputs: OptionInput[];
}

// Invoke a ChallengeFileFactory with an empty settings stub and pluck the static
// descriptor fields. pkc-js' contract is that the factory is a pure constructor:
// I/O happens later in `getChallenge`, not during the factory call itself.
async function extractMetadata(specifier: string, name: string): Promise<Omit<ChallengeMetadata, "packageName">> {
  const mod = await import(specifier);
  const factory = mod.default;
  if (typeof factory !== "function") {
    throw new Error(`challenge-metadata: ${specifier} has no default-exported factory`);
  }
  const file = factory({ challengeSettings: { name, options: {} } });
  return {
    name,
    description: typeof file?.description === "string" ? file.description : undefined,
    type: typeof file?.type === "string" ? file.type : undefined,
    optionInputs: Array.isArray(file?.optionInputs) ? (file.optionInputs as OptionInput[]) : []
  };
}

function externalNameFor(pkg: string): string {
  // `@bitsocial/voucher-challenge` → `voucher`. The name is a UI label only:
  // pkc-js doesn't resolve external packages by name, so the emitted config
  // uses `path: "<pkg>"` regardless.
  return pkg.replace(/^@[^/]+\//, "").replace(/-challenge$/, "");
}

function challengeMetadataPlugin(): Plugin {
  const virtualId = "virtual:challenge-metadata";
  const resolvedId = "\0" + virtualId;
  return {
    name: "challenge-metadata",
    resolveId(source) {
      if (source === virtualId) return resolvedId;
      return null;
    },
    async load(id) {
      if (id !== resolvedId) return null;

      const builtins: ChallengeMetadata[] = [];
      const builtinFiles = readdirSync(pkcBuiltinChallengesDir)
        .filter((f) => f.endsWith(".js"))
        .sort();
      for (const f of builtinFiles) {
        const name = path.basename(f, ".js");
        const specifier = pathToFileURL(path.join(pkcBuiltinChallengesDir, f)).href;
        builtins.push(await extractMetadata(specifier, name));
      }
      if (builtins.length < 3) {
        throw new Error(
          `challenge-metadata: only found ${builtins.length} pkc-js built-in(s) in ${pkcBuiltinChallengesDir} — layout likely changed`
        );
      }

      const externals: ChallengeMetadata[] = [];
      for (const pkg of EXTERNAL_CHALLENGE_PACKAGES) {
        const name = externalNameFor(pkg);
        const meta = await extractMetadata(pkg, name);
        externals.push({ ...meta, packageName: pkg });
      }

      // JSON literals can't carry `as const` narrowing; the shapes are declared
      // in src/vite-env.d.ts so TS callers see the full types.
      return `export const BUILTIN_CHALLENGES = Object.freeze(${JSON.stringify(builtins)});
export const EXTERNAL_CHALLENGES = Object.freeze(${JSON.stringify(externals)});
`;
    }
  };
}

export default defineConfig({
  plugins: [challengeMetadataPlugin(), react(), viteSingleFile()],
  base: "./",
  resolve: {
    alias: [
      { find: "@pkc/community-schema", replacement: pkcCommunitySchema },
      { find: "@pkc/comment-schema", replacement: pkcCommentSchema }
    ]
  },
  test: {
    environment: "happy-dom",
    setupFiles: ["./src/test/setup.ts"],
    globals: false,
    include: ["src/**/*.test.{ts,tsx}"]
  }
});
