import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { ChipInput } from "../components/ui/ChipInput.tsx";

function Harness({ initial = [] as string[], onChange }: { initial?: string[]; onChange?: (v: string[]) => void }) {
  const [value, setValue] = useState<string[]>(initial);
  return (
    <ChipInput
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
      ariaLabel="tags"
    />
  );
}

describe("ChipInput", () => {
  it("commits a token on Enter", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);
    const input = screen.getByLabelText("tags");
    await user.type(input, "admin{Enter}");
    expect(onChange).toHaveBeenLastCalledWith(["admin"]);
  });

  it("splits comma-separated paste into multiple chips", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);
    const input = screen.getByLabelText("tags");
    await user.click(input);
    await user.paste("owner, admin, moderator");
    expect(onChange).toHaveBeenLastCalledWith(["owner", "admin", "moderator"]);
  });

  it("removes the last chip on Backspace when input is empty", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial={["owner", "admin"]} onChange={onChange} />);
    const input = screen.getByLabelText("tags");
    await user.click(input);
    await user.keyboard("{Backspace}");
    expect(onChange).toHaveBeenLastCalledWith(["owner"]);
  });

  it("de-duplicates tokens", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial={["admin"]} onChange={onChange} />);
    const input = screen.getByLabelText("tags");
    await user.type(input, "admin,admin,moderator{Enter}");
    expect(onChange).toHaveBeenLastCalledWith(["admin", "moderator"]);
  });
});
