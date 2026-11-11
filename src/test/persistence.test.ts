import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import type { ChallengeSettings } from "../types/challenges.ts";
import { STORAGE_KEY, clearDraft, hydrateInitialState, loadDraft, saveDraft } from "../state/persistence.ts";
import { encodeShareHash } from "../lib/share.ts";
import { App } from "../App.tsx";
import { SettingsProvider } from "../state/useSettingsStore.ts";

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

  it("ignores a stored draft the editor cannot render", () => {
    localStorage.setItem(STORAGE_KEY, "[null]");
    expect(loadDraft()).toBeUndefined();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ name: "x", exclude: [null] }]));
    expect(loadDraft()).toBeUndefined();
  });

  it("keeps a stored draft that is still being edited", () => {
    const inProgress = [{ description: "no name or path yet" }] as unknown as ChallengeSettings;
    saveDraft(inProgress);
    expect(loadDraft()).toEqual(inProgress);
  });

  it("hydrateInitialState falls back to the draft when the share hash cannot be rendered", () => {
    saveDraft(SAMPLE);
    window.location.hash = "#" + encodeShareHash([null] as unknown as ChallengeSettings);
    expect(hydrateInitialState()).toEqual(SAMPLE);
  });

  it("an edit made after opening a share link survives a reload", async () => {
    saveDraft(SAMPLE);
    window.location.hash = "#" + encodeShareHash([{ name: "text-math" }]);
    const user = userEvent.setup();
    // No StrictMode: production runs the save effect once, so the hydrated state is not saved on mount.
    const view = render(createElement(SettingsProvider, null, createElement(App)));
    await user.click(screen.getByRole("button", { name: /add challenge/i }));
    view.unmount();
    expect(hydrateInitialState()).toEqual([{ name: "text-math" }, { name: "text-math" }]);
  });

  it("keeps the share link when the draft cannot be saved", async () => {
    window.location.hash = "#" + encodeShareHash([{ name: "text-math" }]);
    // Spy on the instance: happy-dom copies Storage methods onto it on first use, so a prototype spy
    // would be skipped once an earlier test has called setItem.
    const setItem = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });
    try {
      const user = userEvent.setup();
      const view = render(createElement(SettingsProvider, null, createElement(App)));
      await user.click(screen.getByRole("button", { name: /add challenge/i }));
      view.unmount();
      expect(setItem).toHaveBeenCalled();
    } finally {
      setItem.mockRestore();
    }
    expect(hydrateInitialState()).toEqual([{ name: "text-math" }]);
  });
});
