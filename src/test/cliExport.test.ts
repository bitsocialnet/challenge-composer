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
      { path: "@bitsocial/captcha-canvas-challenge" },
      { path: "@bitsocial/voucher-challenge" },
      { path: "@bitsocial/voucher-challenge" }
    ];
    const targets = collectInstallTargets(settings);
    expect(targets).toEqual([
      {
        name: "@bitsocial/captcha-canvas-challenge",
        package: "@bitsocial/captcha-canvas-challenge",
        guessed: false
      },
      {
        name: "@bitsocial/voucher-challenge",
        package: "@bitsocial/voucher-challenge",
        guessed: false
      }
    ]);
    const result = buildCliExport(settings, { address: "demo.bso" });
    expect(result.script).toMatch(/bitsocial challenge install @bitsocial\/captcha-canvas-challenge/);
    expect(result.script).toMatch(/bitsocial challenge install @bitsocial\/voucher-challenge/);
  });

  it("maps bare external names via the derived package map", () => {
    const settings: ChallengeSettings = [{ name: "voucher" }, { name: "ai-moderation" }];
    const targets = collectInstallTargets(settings);
    expect(targets).toEqual([
      { name: "voucher", package: "@bitsocial/voucher-challenge", guessed: false },
      { name: "ai-moderation", package: "@bitsocial/ai-moderation-challenge", guessed: false }
    ]);
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
