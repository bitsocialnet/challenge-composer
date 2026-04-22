import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ChallengeSettings } from "../types/challenges.ts";
import { STORAGE_KEY, clearDraft, hydrateInitialState, loadDraft, saveDraft } from "../state/persistence.ts";

const SAMPLE: ChallengeSettings = [
  {
    name: "captcha-canvas-v3",
    description: "Solve to post",
    options: { characters: "6" },
    exclude: [{ role: ["moderator"] }]
  }
];

describe("persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    window.location.hash = "";
  });
  afterEach(() => {
    localStorage.clear();
    window.location.hash = "";
  });

  it("round-trips via localStorage", () => {
    saveDraft(SAMPLE);
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy();
    expect(loadDraft()).toEqual(SAMPLE);
  });

  it("returns undefined when nothing stored", () => {
    expect(loadDraft()).toBeUndefined();
  });

  it("clears a draft", () => {
    saveDraft(SAMPLE);
    clearDraft();
    expect(loadDraft()).toBeUndefined();
  });

  it("hydrateInitialState falls back to empty array", () => {
    expect(hydrateInitialState()).toEqual([]);
  });

  it("hydrateInitialState prefers URL hash over localStorage", async () => {
    saveDraft(SAMPLE);
    const { encodeShareHash } = await import("../lib/share.ts");
    window.location.hash = "#" + encodeShareHash([{ name: "text-math" }]);
    const result = hydrateInitialState();
    expect(result).toEqual([{ name: "text-math" }]);
  });
});
