import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./JsonPreview.module.css";
import { parseJsonc, stringifyJson } from "../../lib/jsonc.ts";
import type { ChallengeSettings } from "../../types/challenges.ts";
import { CommunityChallengeSettingSchema } from "../../pkc-schema.ts";
import { useSettings } from "../../state/useSettingsStore.ts";

type ValidationResult = ReturnType<ReturnType<typeof CommunityChallengeSettingSchema.array>["safeParse"]>;

const ChallengeSettingsArraySchema = CommunityChallengeSettingSchema.array();

interface JsonPreviewProps {
  settings: ChallengeSettings;
  validation: ValidationResult;
}

export function JsonPreview({ settings, validation }: JsonPreviewProps) {
  const { dispatch } = useSettings();
  const canonicalFromState = useMemo(() => stringifyJson(settings), [settings]);
  const [text, setText] = useState(canonicalFromState);
  const [parseError, setParseError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Canonical form of the last state we either rendered-from or dispatched-to.
  // When `canonicalFromState` differs from this, the change came from outside
  // this component — sync the textarea. When it matches, it's our own round-trip
  // and we must leave the textarea alone to preserve the user's formatting.
  const lastKnownCanonical = useRef(canonicalFromState);

  useEffect(() => {
    if (canonicalFromState !== lastKnownCanonical.current) {
      lastKnownCanonical.current = canonicalFromState;
      setText(canonicalFromState);
      setParseError(null);
    }
  }, [canonicalFromState]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    setText(next);
    const { value, errors } = parseJsonc(next);
    if (errors.length) {
      setParseError(`JSONC parse error: ${errors.join(", ")}`);
      return;
    }
    const parsed = ChallengeSettingsArraySchema.safeParse(value);
    if (!parsed.success) {
      // Let validation (below) surface structural issues; don't block typing.
      setParseError(null);
      return;
    }
    setParseError(null);
    const nextCanonical = stringifyJson(parsed.data);
    if (nextCanonical === lastKnownCanonical.current) return;
    lastKnownCanonical.current = nextCanonical;
    dispatch({ type: "REPLACE_ALL", settings: parsed.data });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable */
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>JSON output</h2>
        <button type="button" onClick={copy}>
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </header>
      {parseError ? <pre className={styles.parseError}>{parseError}</pre> : null}
      {!parseError && !validation.success ? (
        <ul className={styles.errors}>
          {validation.error.issues.map((issue, i) => (
            <li key={i}>
              <code>{issue.path.map(String).join(".") || "(root)"}</code>: {issue.message}
            </li>
          ))}
        </ul>
      ) : null}
      <textarea
        className={styles.editor}
        spellCheck={false}
        value={text}
        onChange={handleChange}
        aria-label="JSON settings"
      />
    </div>
  );
}
