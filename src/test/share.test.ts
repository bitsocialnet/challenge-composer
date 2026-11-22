import { describe, expect, it } from "vitest";
import { buildShareUrl, decodeShareHash, encodeShareHash } from "../lib/share.ts";
import type { ChallengeSettings } from "../types/challenges.ts";

const COMPLEX: ChallengeSettings = [
  {
    name: "captcha-canvas-v3",
    description: "nontrivial description with unicode ✓ 日本語",
    options: { characters: "6", width: "280" },
    exclude: [{ role: ["moderator", "owner"] }, { rateLimit: 5, rateLimitChallengeSuccess: false }]
  },
  { name: "text-math" }
];

describe("share encode/decode", () => {
  it("round-trips a non-trivial settings array", () => {
    const hash = encodeShareHash(COMPLEX);
    expect(hash.startsWith("s=")).toBe(true);
    expect(decodeShareHash(hash)).toEqual(COMPLEX);
    expect(decodeShareHash("#" + hash)).toEqual(COMPLEX);
  });

  it("returns undefined for invalid hashes", () => {
    expect(decodeShareHash("")).toBeUndefined();
    expect(decodeShareHash("#")).toBeUndefined();
    expect(decodeShareHash("#s=")).toBeUndefined();
    expect(decodeShareHash("#foo=bar")).toBeUndefined();
    expect(decodeShareHash("#s=@@@@notvalid@@@")).toBeUndefined();
  });

  it("builds a full share URL", () => {
    const url = buildShareUrl(COMPLEX, "https://example.com/app/");
    expect(url.startsWith("https://example.com/app/#s=")).toBe(true);
    const decoded = decodeShareHash(url.split("#")[1] ?? "");
    expect(decoded).toEqual(COMPLEX);
  });

  it("rejects payloads whose shape the editor cannot render", () => {
    const malformed = [
      [null],
      [{ name: "x", exclude: [null] }],
      [{ name: "x", exclude: {} }],
      [{ name: "x", exclude: [{ role: "moderator" }] }],
      [{ name: "x", exclude: [{ role: [{}] }] }],
      [{ name: "x", exclude: [{ role: [1] }] }]
    ];
    for (const payload of malformed) {
      expect(decodeShareHash(encodeShareHash(payload as unknown as ChallengeSettings))).toBeUndefined();
    }
  });

  it("keeps settings that are still being edited", () => {
    const inProgress = [
      { description: "no name or path yet" },
      { name: "x", exclude: [{ community: { addresses: [], maxCommentCids: 100 } }] }
    ] as unknown as ChallengeSettings;
    expect(decodeShareHash(encodeShareHash(inProgress))).toEqual(inProgress);
  });
});
