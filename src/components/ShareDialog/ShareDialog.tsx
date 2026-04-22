import { useMemo, useState } from "react";
import styles from "./ShareDialog.module.css";
import { buildShareUrl } from "../../lib/share.ts";
import { useSettings } from "../../state/useSettingsStore.ts";

interface ShareDialogProps {
  onClose: () => void;
}

export function ShareDialog({ onClose }: ShareDialogProps) {
  const { state } = useSettings();
  const url = useMemo(() => buildShareUrl(state), [state]);
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const applyToLocation = () => {
    const fragment = url.split("#")[1];
    if (fragment) {
      window.location.hash = fragment;
      setApplied(true);
      setTimeout(() => setApplied(false), 1500);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <header className={styles.header}>
          <h2>Share via URL</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <p className={styles.warning}>
          <strong>Heads-up:</strong> your entire settings blob is encoded into the URL fragment
          (<code>#s=…</code>). Browsers don't send the fragment to any server, so it won't leak over
          the wire — but anyone you share the URL with can reconstruct the settings verbatim.
          If your challenge options include anything you consider sensitive, don't share this URL
          publicly.
        </p>
        <label htmlFor="share-url">Shareable URL ({url.length.toLocaleString()} chars)</label>
        <textarea id="share-url" className={styles.textarea} readOnly value={url} rows={6} onFocus={(e) => e.currentTarget.select()} />
        <footer className={styles.footer}>
          <button type="button" onClick={applyToLocation}>
            {applied ? "Applied ✓" : "Apply to this tab"}
          </button>
          <button type="button" className="primary" onClick={copy}>
            {copied ? "Copied ✓" : "Copy URL"}
          </button>
        </footer>
      </div>
    </div>
  );
}
