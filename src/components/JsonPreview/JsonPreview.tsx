import { useMemo, useState } from "react";
import styles from "./JsonPreview.module.css";
import { stringifyJson } from "../../lib/jsonc.ts";
import type { ChallengeSettings } from "../../types/challenges.ts";
import { CommunityChallengeSettingSchema } from "../../pkc-schema.ts";

type ValidationResult = ReturnType<ReturnType<typeof CommunityChallengeSettingSchema.array>["safeParse"]>;

interface JsonPreviewProps {
  settings: ChallengeSettings;
  validation: ValidationResult;
}

export function JsonPreview({ settings, validation }: JsonPreviewProps) {
  const text = useMemo(() => stringifyJson(settings), [settings]);
  const [copied, setCopied] = useState(false);

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
      {!validation.success ? (
        <ul className={styles.errors}>
          {validation.error.issues.map((issue, i) => (
            <li key={i}>
              <code>{issue.path.map(String).join(".") || "(root)"}</code>: {issue.message}
            </li>
          ))}
        </ul>
      ) : null}
      <pre className={styles.pre}>
        <code>{text}</code>
      </pre>
    </div>
  );
}
