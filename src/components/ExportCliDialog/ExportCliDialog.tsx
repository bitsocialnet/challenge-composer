import { useMemo, useState } from "react";
import styles from "./ExportCliDialog.module.css";
import { useSettings } from "../../state/useSettingsStore.ts";
import { buildCliExport } from "../../lib/cliExport.ts";

interface ExportCliDialogProps {
  onClose: () => void;
}

export function ExportCliDialog({ onClose }: ExportCliDialogProps) {
  const { state } = useSettings();
  const [address, setAddress] = useState("");
  const [jsonPath, setJsonPath] = useState("./community-edit.json");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => buildCliExport(state, { address, jsonPath }), [state, address, jsonPath]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.script);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable */
    }
  };

  const guessed = result.installTargets.filter((t) => t.guessed);

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <header className={styles.header}>
          <h2>Export as bitsocial-cli command</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <p className={styles.hint}>
          Runs <code>bitsocial challenge install</code> for each non-built-in challenge, then applies the
          settings via <code>bitsocial community edit</code>.
        </p>
        <div className={styles.fields}>
          <label className={styles.field}>
            <span>Community address</span>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="your-community.bso"
            />
          </label>
          <label className={styles.field}>
            <span>Edit JSON path</span>
            <input type="text" value={jsonPath} onChange={(e) => setJsonPath(e.target.value)} />
          </label>
        </div>
        {guessed.length ? (
          <div className={styles.warning}>
            <strong>Heads-up:</strong> no known npm package for{" "}
            {guessed.map((t, i) => (
              <span key={t.name}>
                <code>{t.name}</code>
                {i < guessed.length - 1 ? ", " : ""}
              </span>
            ))}
            . Fill the placeholder in the install line with the right package specifier.
          </div>
        ) : null}
        <textarea
          className={styles.textarea}
          readOnly
          value={result.script}
          rows={18}
          onFocus={(e) => e.currentTarget.select()}
        />
        <footer className={styles.footer}>
          <button type="button" onClick={onClose}>
            Close
          </button>
          <button type="button" className="primary" onClick={copy}>
            {copied ? "Copied ✓" : "Copy script"}
          </button>
        </footer>
      </div>
    </div>
  );
}
