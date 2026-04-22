import { useState } from "react";
import styles from "./ImportDialog.module.css";
import { parseJsonc } from "../../lib/jsonc.ts";
import { CommunityChallengeSettingSchema } from "../../pkc-schema.ts";
import { useSettings } from "../../state/useSettingsStore.ts";

const ChallengeSettingsArraySchema = CommunityChallengeSettingSchema.array();

interface ImportDialogProps {
  onClose: () => void;
}

export function ImportDialog({ onClose }: ImportDialogProps) {
  const { dispatch } = useSettings();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const apply = () => {
    const { value, errors } = parseJsonc(text);
    if (errors.length) {
      setError(`JSONC parse error: ${errors.join(", ")}`);
      return;
    }
    const parsed = ChallengeSettingsArraySchema.safeParse(value);
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("\n"));
      return;
    }
    dispatch({ type: "REPLACE_ALL", settings: parsed.data });
    onClose();
  };

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <header className={styles.header}>
          <h2>Paste JSONC</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <p className={styles.hint}>
          Paste an array of challenge settings (JSON or JSONC with comments).
        </p>
        <textarea
          className={styles.textarea}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={18}
          placeholder={'[\n  {\n    "name": "captcha-canvas-v3",\n    "options": { "characters": "6" }\n  }\n]'}
          autoFocus
        />
        {error ? <pre className={styles.error}>{error}</pre> : null}
        <footer className={styles.footer}>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="primary" onClick={apply}>
            Import &amp; replace
          </button>
        </footer>
      </div>
    </div>
  );
}
