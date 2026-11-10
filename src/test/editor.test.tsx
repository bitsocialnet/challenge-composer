import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { App } from "../App.tsx";
import { SettingsProvider } from "../state/useSettingsStore.ts";
import type { ChallengeSettings } from "../types/challenges.ts";

function renderApp(initialState: ChallengeSettings = []) {
  return render(
    <StrictMode>
      <SettingsProvider initialState={initialState}>
        <App />
      </SettingsProvider>
    </StrictMode>
  );
}

describe("editor", () => {
  beforeEach(() => {
    localStorage.clear();
    window.location.hash = "";
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
  });

  it("adds a challenge and shows it in the JSON preview", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: /add challenge/i }));
    const previewEditor = screen.getByRole("textbox", { name: /json settings/i }) as HTMLTextAreaElement;
    expect(previewEditor.value).toMatch(/text-math/);
    expect(screen.getByText(/#1/)).toBeInTheDocument();
  });

  it("adds a challenge option via the suggested dropdown", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: /add challenge/i }));
    const card = screen.getByText(/#1/).closest("article");
    if (!card) throw new Error("card not found");
    const suggestSelects = within(card).getAllByRole("combobox");
    const hintSelect = suggestSelects.find((s) => s.querySelector("option[value='difficulty']"));
    if (!hintSelect) throw new Error("hint select not found");
    await user.selectOptions(hintSelect, "difficulty");
    const previewEditor = screen.getByRole("textbox", { name: /json settings/i }) as HTMLTextAreaElement;
    expect(previewEditor.value).toMatch(/"difficulty":/);
  });

  it("adds then removes an exclude group", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: /add challenge/i }));
    await user.click(screen.getByRole("button", { name: /add bypass group/i }));
    expect(screen.getByText(/group 1/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /remove group/i }));
    expect(screen.queryByText(/group 1/i)).not.toBeInTheDocument();
  });

  it("removes a challenge after confirmation", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: /add challenge/i }));
    expect(screen.getByText(/#1/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^remove$/i }));
    expect(screen.queryByText(/#1/)).not.toBeInTheDocument();
  });

  it("editing the JSON preview updates the editor", async () => {
    renderApp();
    const previewEditor = screen.getByRole("textbox", { name: /json settings/i }) as HTMLTextAreaElement;
    fireEvent.change(previewEditor, { target: { value: '[{"name": "text-math"}]' } });
    expect(screen.getByText(/#1/)).toBeInTheDocument();
    const knownSelect = screen.getByLabelText(/^challenge$/i) as HTMLSelectElement;
    expect(knownSelect.value).toBe("builtin:text-math");
  });

  it("shows schema errors for JSON preview text that is not applied", () => {
    renderApp();
    const previewEditor = screen.getByRole("textbox", { name: /json settings/i }) as HTMLTextAreaElement;
    fireEvent.change(previewEditor, { target: { value: '[{"name":"text-math","desciption":"x"}]' } });
    // The store keeps its previous (empty) value, so the error must come from the typed text.
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(screen.getByText(/desciption/, { selector: "li" })).toBeInTheDocument();

    fireEvent.change(previewEditor, { target: { value: '[{"description":"x"}]' } });
    expect(screen.getByText(/path or name of challenge has to be defined/i, { selector: "li" })).toBeInTheDocument();

    fireEvent.change(previewEditor, { target: { value: '[{"name":"text-math"}]' } });
    expect(screen.getByRole("article")).toBeInTheDocument();
    expect(screen.queryByText(/path or name of challenge has to be defined/i)).not.toBeInTheDocument();
  });

  it("collapses and expands a challenge row", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: /add challenge/i }));
    const article = screen.getByRole("article");
    const expandedToggle = within(article).getByRole("button", { expanded: true });
    expect(screen.getByLabelText(/^challenge$/i)).toBeInTheDocument();
    await user.click(expandedToggle);
    expect(screen.queryByLabelText(/^challenge$/i)).not.toBeInTheDocument();
    const collapsedToggle = within(article).getByRole("button", { expanded: false });
    await user.click(collapsedToggle);
    expect(screen.getByLabelText(/^challenge$/i)).toBeInTheDocument();
  });

  it("moves a challenge down with the Move down button", async () => {
    const user = userEvent.setup();
    renderApp();
    const previewEditor = screen.getByRole("textbox", { name: /json settings/i }) as HTMLTextAreaElement;
    fireEvent.change(previewEditor, { target: { value: '[{"name":"alpha"},{"name":"beta"}]' } });
    const moveUpButtons = screen.getAllByRole("button", { name: /move up/i });
    expect(moveUpButtons[0]).toBeDisabled();
    expect(moveUpButtons[1]).not.toBeDisabled();
    const moveDownButtons = screen.getAllByRole("button", { name: /move down/i });
    expect(moveDownButtons[0]).not.toBeDisabled();
    expect(moveDownButtons[1]).toBeDisabled();
    await user.click(moveDownButtons[0]!);
    const updated = previewEditor.value;
    expect(updated.indexOf("beta")).toBeLessThan(updated.indexOf("alpha"));
  });

  it("drops a bypass group with no other condition left when its passed challenge is removed", async () => {
    const user = userEvent.setup();
    renderApp([{ name: "alpha" }, { name: "beta", exclude: [{ challenges: [0], postCount: 3 }] }]);
    const previewEditor = screen.getByRole("textbox", { name: /json settings/i }) as HTMLTextAreaElement;

    // The x button leaves `postCount: undefined` behind in the group, which is not a condition.
    await user.click(screen.getByRole("button", { name: /remove condition posts/i }));
    await user.click(screen.getAllByRole("button", { name: /^remove$/i })[0]!);
    expect(JSON.parse(previewEditor.value)).toEqual([{ name: "beta" }]);
    expect(screen.queryByText(/empty group/i)).not.toBeInTheDocument();
  });

  it("keeps passed-challenge references on the same challenge after a move or removal", async () => {
    const user = userEvent.setup();
    renderApp([
      { name: "alpha" },
      { name: "beta" },
      {
        name: "gamma",
        exclude: [{ challenges: [0] }, { role: ["moderator"], challenges: [0] }, { challenges: [0, 1] }]
      }
    ]);
    const previewEditor = screen.getByRole("textbox", { name: /json settings/i }) as HTMLTextAreaElement;
    const preview = () => JSON.parse(previewEditor.value) as ChallengeSettings;

    // beta moves above alpha: gamma must still require alpha, now at index 1.
    await user.click(screen.getAllByRole("button", { name: /move up/i })[1]!);
    expect(preview().map((c) => c.name)).toEqual(["beta", "alpha", "gamma"]);
    expect(preview()[2]?.exclude).toEqual([
      { challenges: [1] },
      { role: ["moderator"], challenges: [1] },
      { challenges: [1, 0] }
    ]);

    // alpha is removed: "passed alpha" can never be met, so the condition goes rather than
    // pointing at whichever challenge takes alpha's place.
    await user.click(screen.getAllByRole("button", { name: /^remove$/i })[1]!);
    expect(preview().map((c) => c.name)).toEqual(["beta", "gamma"]);
    expect(preview()[1]?.exclude).toEqual([{ role: ["moderator"] }]);
  });
});
