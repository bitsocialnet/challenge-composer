import { useId, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import styles from "./ChipInput.module.css";

export interface ChipInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  monospace?: boolean;
  ariaLabel?: string;
}

const SPLIT_RE = /[,\n]/;

export function ChipInput({ value, onChange, suggestions, placeholder, monospace, ariaLabel }: ChipInputProps) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const commit = (raw: string) => {
    const tokens = raw
      .split(SPLIT_RE)
      .map((t) => t.trim())
      .filter(Boolean);
    if (tokens.length === 0) return;
    const next = [...value];
    for (const t of tokens) if (!next.includes(t)) next.push(t);
    if (next.length !== value.length) onChange(next);
    setDraft("");
  };

  const removeAt = (i: number) => onChange(value.filter((_, j) => j !== i));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Tab" && draft) {
      commit(draft);
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      e.preventDefault();
      removeAt(value.length - 1);
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (SPLIT_RE.test(text)) {
      e.preventDefault();
      commit(text);
    }
  };

  const onBlur = () => {
    if (draft) commit(draft);
  };

  return (
    <div
      className={`${styles.wrap} ${monospace ? styles.mono : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) inputRef.current?.focus();
      }}
    >
      {value.map((chip, i) => (
        <span key={`${chip}-${i}`} className={styles.chip}>
          <span className={styles.chipLabel}>{chip}</span>
          <button
            type="button"
            className={styles.remove}
            aria-label={`Remove ${chip}`}
            onClick={(e) => {
              e.stopPropagation();
              removeAt(i);
            }}
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        className={styles.input}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onBlur={onBlur}
        placeholder={value.length === 0 ? placeholder : undefined}
        aria-label={ariaLabel}
        list={suggestions && suggestions.length > 0 ? listId : undefined}
      />
      {suggestions && suggestions.length > 0 ? (
        <datalist id={listId}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      ) : null}
    </div>
  );
}
