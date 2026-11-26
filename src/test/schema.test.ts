import { describe, expect, it } from "vitest";
import { parseJsonc } from "../lib/jsonc.ts";
import { CommunityChallengeSettingSchema } from "../pkc-schema.ts";

const ChallengeSettingsArraySchema = CommunityChallengeSettingSchema.array();
import fiveChan from "../presets/5chan-community-defaults.jsonc?raw";
import captchaOnly from "../presets/captcha-only.jsonc?raw";
import empty from "../presets/empty.jsonc?raw";

describe("ChallengeSettings schema", () => {
  it("accepts a minimal captcha entry", () => {
    const result = CommunityChallengeSettingSchema.safeParse({ name: "captcha-canvas-v3" });
    expect(result.success).toBe(true);
  });

  it("rejects a challenge with neither name nor path", () => {
    const result = CommunityChallengeSettingSchema.safeParse({ description: "nope" });
    expect(result.success).toBe(false);
  });

  it("rejects non-string option values", () => {
    const result = CommunityChallengeSettingSchema.safeParse({
      name: "captcha-canvas-v3",
      options: { characters: 6 }
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty exclude array", () => {
    const result = CommunityChallengeSettingSchema.safeParse({ name: "x", exclude: [] });
    expect(result.success).toBe(false);
  });

  it("accepts a complex exclude rule", () => {
    const result = CommunityChallengeSettingSchema.safeParse({
      name: "captcha-canvas-v3",
      exclude: [
        { roles: ["moderator"] },
        { rateLimit: 5, rateLimitChallengeSuccess: false },
        { publicationType: { reply: true } }
      ]
    });
    expect(result.success).toBe(true);
  });

  it("accepts author public keys and names", () => {
    const result = CommunityChallengeSettingSchema.safeParse({
      name: "captcha-canvas-v3",
      exclude: [{ publicKeys: ["12D3KooWG3XbzoVyAE6Y9vHZKF64Yuuu4TjdgQKedk14iYmTEPWu"] }, { names: ["example.bso"] }]
    });
    expect(result.success).toBe(true);
  });

  it("rejects the exclude role and address fields pkc-js renamed and removed", () => {
    expect(CommunityChallengeSettingSchema.safeParse({ name: "x", exclude: [{ role: ["moderator"] }] }).success).toBe(false);
    expect(CommunityChallengeSettingSchema.safeParse({ name: "x", exclude: [{ address: ["example.bso"] }] }).success).toBe(false);
  });

  it("validates all bundled presets", () => {
    for (const raw of [fiveChan, captchaOnly, empty]) {
      const { value, errors } = parseJsonc(raw);
      expect(errors).toEqual([]);
      const parsed = ChallengeSettingsArraySchema.safeParse(value);
      if (!parsed.success) throw new Error(JSON.stringify(parsed.error.issues, null, 2));
      expect(parsed.success).toBe(true);
    }
  });

  it("parses the 5chan preset into 4 challenges", () => {
    const { value } = parseJsonc(fiveChan);
    const parsed = ChallengeSettingsArraySchema.parse(value);
    expect(parsed).toHaveLength(4);
    expect(parsed[0]?.name).toBe("fail");
    expect(parsed[2]?.name).toBe("captcha-canvas-v3");
    expect(parsed[2]?.pendingApproval).toBe(true);
  });
});
