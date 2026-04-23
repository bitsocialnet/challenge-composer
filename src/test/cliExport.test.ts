import { describe, expect, it } from "vitest";
import { buildCliExport, collectInstallTargets } from "../lib/cliExport.ts";
import type { ChallengeSettings } from "../types/challenges.ts";

describe("cliExport", () => {
  it("omits install step for built-in challenges only", () => {
    const settings: ChallengeSettings = [{ name: "text-math" }, { name: "fail" }];
    const result = buildCliExport(settings, { address: "demo.bso" });
    expect(result.installTargets).toEqual([]);
    expect(result.script).not.toMatch(/challenge install/);
    expect(result.script).toMatch(/bitsocial community edit demo\.bso/);
  });

  it("emits install lines for known external challenges and dedupes", () => {
    const settings: ChallengeSettings = [
      { name: "captcha-canvas-v3" },
      { name: "mintpass" },
      { name: "mintpass" }
    ];
    const targets = collectInstallTargets(settings);
    expect(targets).toEqual([
      { name: "captcha-canvas-v3", package: "@bitsocial/captcha-canvas-challenge", guessed: false },
      { name: "mintpass", package: "@bitsocial/mintpass-challenge", guessed: false }
    ]);
    const result = buildCliExport(settings, { address: "demo.bso" });
    expect(result.script).toMatch(/bitsocial challenge install @bitsocial\/captcha-canvas-challenge/);
    expect(result.script).toMatch(/bitsocial challenge install @bitsocial\/mintpass-challenge/);
  });

  it("passes through the path field verbatim as the install specifier", () => {
    const settings: ChallengeSettings = [{ path: "./my-local-challenge" }];
    const targets = collectInstallTargets(settings);
    expect(targets[0]).toMatchObject({ package: "./my-local-challenge", guessed: false });
  });

  it("flags unknown names with a guessed placeholder", () => {
    const settings: ChallengeSettings = [{ name: "mystery-challenge" }];
    const targets = collectInstallTargets(settings);
    expect(targets[0]?.guessed).toBe(true);
    const result = buildCliExport(settings);
    expect(result.script).toMatch(/TODO: replace with the package that provides "mystery-challenge"/);
  });

  it("wraps the settings array inside settings.challenges in the jsonFile payload", () => {
    const settings: ChallengeSettings = [{ name: "text-math" }];
    const result = buildCliExport(settings, { address: "demo.bso" });
    expect(result.script).toMatch(/"settings":\s*{\s*"challenges":\s*\[/);
  });
});
