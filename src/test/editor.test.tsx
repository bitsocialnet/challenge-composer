import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { App } from "../App.tsx";
import { SettingsProvider } from "../state/useSettingsStore.ts";

function renderApp() {
  return render(
    <StrictMode>
      <SettingsProvider initialState={[]}>
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
    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    expect(nameInput.value).toBe("text-math");
  });

  it("collapses and expands a challenge row", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: /add challenge/i }));
    const article = screen.getByRole("article");
    const expandedToggle = within(article).getByRole("button", { expanded: true });
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    await user.click(expandedToggle);
    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument();
    const collapsedToggle = within(article).getByRole("button", { expanded: false });
    await user.click(collapsedToggle);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
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
});
