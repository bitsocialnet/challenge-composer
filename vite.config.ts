/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { fileURLToPath } from "node:url";

// pkc-js's community schema sits at an internal subpath (not exposed in its `exports`
// map), so we alias it directly — import, never mirror.
const pkcCommunitySchema = fileURLToPath(
  new URL("./node_modules/@pkcprotocol/pkc-js/dist/browser/community/schema.js", import.meta.url)
);
const pkcCommentSchema = fileURLToPath(
  new URL("./node_modules/@pkcprotocol/pkc-js/dist/browser/publications/comment/schema.js", import.meta.url)
);

export default defineConfig({
  plugins: [react(), viteSingleFile()],
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
