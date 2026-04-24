/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

// pkc-js's community schema sits at an internal subpath (not exposed in its `exports`
// map), so we alias it directly — import, never mirror.
const pkcCommunitySchema = fileURLToPath(
  new URL("./node_modules/@pkcprotocol/pkc-js/dist/browser/community/schema.js", import.meta.url)
);
const pkcCommentSchema = fileURLToPath(
  new URL("./node_modules/@pkcprotocol/pkc-js/dist/browser/publications/comment/schema.js", import.meta.url)
);

// pkc-js browser bundle stubs `pkcJsChallenges` to `{}` — only the node bundle has the
// real map. We don't want to ship pkc-js's node runtime just to learn 6 names, so parse
// the compiled source at build time and emit the key list as a virtual module.
const pkcChallengesSource = fileURLToPath(
  new URL(
    "./node_modules/@pkcprotocol/pkc-js/dist/node/runtime/node/community/challenges/index.js",
    import.meta.url
  )
);

function pkcBuiltinNamesPlugin(): Plugin {
  const virtualId = "virtual:pkc-js-builtin-names";
  const resolvedId = "\0" + virtualId;
  return {
    name: "pkc-js-builtin-names",
    resolveId(source) {
      if (source === virtualId) return resolvedId;
      return null;
    },
    load(id) {
      if (id !== resolvedId) return null;
      const src = readFileSync(pkcChallengesSource, "utf8");
      const objBlock = src.match(/const pkcJsChallenges\s*=\s*\{([\s\S]*?)\};/);
      if (!objBlock) {
        throw new Error(
          "pkc-js-builtin-names: could not locate `pkcJsChallenges` literal in " + pkcChallengesSource
        );
      }
      const keys = [...objBlock[1].matchAll(/(?:^|[,{\n])\s*["']?([a-z][a-z0-9-]*)["']?\s*:/g)]
        .map((m) => m[1])
        .sort();
      if (keys.length < 3) {
        throw new Error(
          `pkc-js-builtin-names: extracted ${keys.length} key(s) from pkcJsChallenges — source format likely changed`
        );
      }
      // Plain JS — `as const` is TS-only; the shape is declared in src/vite-env.d.ts.
      return `export const PKC_BUILTIN_CHALLENGE_NAMES = Object.freeze(${JSON.stringify(keys)});\n`;
    }
  };
}

export default defineConfig({
  plugins: [pkcBuiltinNamesPlugin(), react(), viteSingleFile()],
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
