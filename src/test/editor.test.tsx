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

  it("re-derives each row's source tab after the rows are reordered", async () => {
    const user = userEvent.setup();
    renderApp([{ path: "./my-challenge.js" }, { name: "text-math" }]);
    await user.click(screen.getAllByRole("button", { name: /move down/i })[0]!);

    const [first, second] = screen.getAllByRole("article");
    expect(within(first!).getByRole("tab", { name: "Known" })).toHaveAttribute("aria-selected", "true");
    expect((within(first!).getByLabelText(/^challenge$/i) as HTMLSelectElement).value).toBe("builtin:text-math");
    expect(within(second!).getByRole("tab", { name: "Custom path" })).toHaveAttribute("aria-selected", "true");
    expect((within(second!).getByLabelText(/challenge file path/i) as HTMLInputElement).value).toBe("./my-challenge.js");
  });

  it("re-derives the source tab after the JSON pane replaces a row", () => {
    renderApp([{ path: "./my-challenge.js" }]);
    const previewEditor = screen.getByRole("textbox", { name: /json settings/i }) as HTMLTextAreaElement;
    fireEvent.change(previewEditor, { target: { value: '[{"name":"text-math"}]' } });
    expect(screen.getByRole("tab", { name: "Known" })).toHaveAttribute("aria-selected", "true");
    expect((screen.getByLabelText(/^challenge$/i) as HTMLSelectElement).value).toBe("builtin:text-math");
  });

  it("moves focus to the group that takes a removed group's place, or to the add button", async () => {
    const user = userEvent.setup();
    renderApp([
      { name: "alpha", exclude: [{ postCount: 1 }, { postCount: 2 }, { postCount: 3 }] },
      { name: "beta", exclude: [{ postCount: 4 }, { postCount: 5 }] }
    ]);
    const [alpha, beta] = screen.getAllByRole("article") as [HTMLElement, HTMLElement];
    const group = (row: HTMLElement, n: number) => within(row).getByLabelText(`Bypass group ${n}`);
    const posts = (row: HTMLElement, n: number) => within(group(row, n)).getByLabelText(/posts threshold/i);
    const removeGroup = (row: HTMLElement, n: number) =>
      within(group(row, n)).getByRole("button", { name: /remove group/i });
    const addGroup = (row: HTMLElement) => within(row).getByRole("button", { name: /add bypass group/i });

    await user.click(removeGroup(alpha, 1));
    expect(posts(alpha, 1)).toHaveValue(2);
    expect(removeGroup(alpha, 1)).toHaveFocus();

    // A keyboard user can keep removing groups from there.
    await user.keyboard("{Enter}");
    expect(posts(alpha, 1)).toHaveValue(3);
    expect(removeGroup(alpha, 1)).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(within(alpha).queryByLabelText("Bypass group 1")).not.toBeInTheDocument();
    expect(addGroup(alpha)).toHaveFocus();

    // No group takes the place of the last one.
    await user.click(removeGroup(beta, 2));
    expect(posts(beta, 1)).toHaveValue(4);
    expect(addGroup(beta)).toHaveFocus();
  });

  it("re-derives duration units after a challenge move or a group removal", async () => {
    const user = userEvent.setup();
    renderApp([
      { name: "alpha", exclude: [{ firstCommentTimestamp: 86400 }] },
      { name: "beta", exclude: [{ firstCommentTimestamp: 3600 }, { firstCommentTimestamp: 120 }] }
    ]);
    const units = () =>
      screen.getAllByLabelText(/account age unit/i).map((el) => (el as HTMLSelectElement).value);
    const amounts = () =>
      screen.getAllByLabelText(/account age amount/i).map((el) => (el as HTMLInputElement).value);
    expect(units()).toEqual(["d", "h", "m"]);

    await user.click(screen.getAllByRole("button", { name: /move down/i })[0]!);
    expect(units()).toEqual(["h", "m", "d"]);
    expect(amounts()).toEqual(["1", "2", "1"]);

    const firstRow = screen.getAllByRole("article")[0]!;
    await user.click(within(firstRow).getAllByRole("button", { name: /remove group/i })[0]!);
    expect(units()).toEqual(["m", "d"]);
    expect(amounts()).toEqual(["2", "1"]);
  });

  it("adds conditions that start empty and keeps a condition row while its value is retyped", async () => {
    const user = userEvent.setup();
    renderApp([{ name: "text-math", exclude: [{ postCount: 10 }, {}] }]);
    const previewEditor = screen.getByRole("textbox", { name: /json settings/i }) as HTMLTextAreaElement;
    const excludes = () => (JSON.parse(previewEditor.value) as ChallengeSettings)[0]?.exclude;
    const group = (n: number) => screen.getByLabelText(`Bypass group ${n}`);
    const addCondition = async (n: number, label: RegExp) => {
      await user.click(within(group(n)).getByRole("button", { name: /add condition/i }));
      await user.click(screen.getByRole("menuitem", { name: label }));
    };

    // Both conditions are seeded with an empty list, which the store drops.
    await addCondition(2, /author address is/i);
    expect(within(group(2)).getByLabelText(/author addresses/i)).toBeInTheDocument();
    await addCondition(2, /passed challenge/i);
    expect(within(group(2)).getByLabelText(/passed challenges/i)).toBeInTheDocument();

    // Clearing a loaded number to retype it keeps the row.
    const loadedPosts = within(group(1)).getByLabelText(/posts threshold/i);
    await user.clear(loadedPosts);
    expect(within(group(1)).getByLabelText(/posts threshold/i)).toBe(loadedPosts);
    await user.type(loadedPosts, "5");
    expect(excludes()?.[0]).toEqual({ postCount: 5 });

    // Same for a number condition added from the menu.
    await addCondition(2, /posts/i);
    const addedPosts = within(group(2)).getByLabelText(/posts threshold/i);
    await user.clear(addedPosts);
    expect(within(group(2)).getByLabelText(/posts threshold/i)).toBe(addedPosts);

    // The x button still removes the row, and the condition can be added again.
    await user.click(within(group(2)).getByRole("button", { name: /remove condition author address is/i }));
    expect(within(group(2)).queryByLabelText(/author addresses/i)).not.toBeInTheDocument();
    await addCondition(2, /author address is/i);
    expect(within(group(2)).getByLabelText(/author addresses/i)).toBeInTheDocument();

    // Removing another group leaves this group's empty conditions on screen.
    await user.click(within(group(1)).getByRole("button", { name: /remove group/i }));
    expect(within(group(1)).getByLabelText(/author addresses/i)).toBeInTheDocument();
    expect(within(group(1)).getByLabelText(/passed challenges/i)).toBeInTheDocument();
  });

  it("shows and sets whether a rate limit counts successful or failed challenges", async () => {
    const user = userEvent.setup();
    renderApp([{ name: "fail", exclude: [{ rateLimit: 5, rateLimitChallengeSuccess: false }] }]);
    const previewEditor = screen.getByRole("textbox", { name: /json settings/i }) as HTMLTextAreaElement;
    const group = () => (JSON.parse(previewEditor.value) as ChallengeSettings)[0]?.exclude?.[0];
    const counts = screen.getByLabelText(/rate limit counts/i) as HTMLSelectElement;
    expect(counts.value).toBe("failed");

    await user.selectOptions(counts, "successful");
    expect(group()).toEqual({ rateLimit: 5, rateLimitChallengeSuccess: true });
    await user.selectOptions(counts, "failed");
    expect(group()).toEqual({ rateLimit: 5, rateLimitChallengeSuccess: false });

    // Retyping the limit keeps the choice instead of falling back to the default (successful).
    const limit = screen.getByLabelText(/rate limit per hour/i);
    await user.clear(limit);
    await user.type(limit, "3");
    expect(group()).toEqual({ rateLimit: 3, rateLimitChallengeSuccess: false });
    expect((screen.getByLabelText(/rate limit counts/i) as HTMLSelectElement).value).toBe("failed");
  });

  it("shows the rate limit row when only its counting flag is set", () => {
    renderApp([{ name: "fail", exclude: [{ rateLimitChallengeSuccess: false }] }]);
    expect(screen.getByLabelText(/rate limit per hour/i)).toHaveValue(null);
    expect((screen.getByLabelText(/rate limit counts/i) as HTMLSelectElement).value).toBe("failed");
  });
});
