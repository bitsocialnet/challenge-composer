import { useMemo } from "react";
import styles from "./OptionsEditor.module.css";
import { hintsForChallenge } from "../../lib/knownChallenges.ts";
import type { CommunityChallengeSetting } from "../../types/challenges.ts";
import { useSettings } from "../../state/useSettingsStore.ts";

interface OptionsEditorProps {
  challengeIndex: number;
  challenge: CommunityChallengeSetting;
}

export function OptionsEditor({ challengeIndex, challenge }: OptionsEditorProps) {
  const { dispatch } = useSettings();
  const entries = useMemo(() => Object.entries(challenge.options ?? {}), [challenge.options]);
  const hints = hintsForChallenge(challenge);

  const replaceOptions = (next: Record<string, string>) => {
    dispatch({ type: "UPDATE_CHALLENGE", index: challengeIndex, patch: { options: next } });
  };

  const setValue = (key: string, value: string) => {
    const next = { ...(challenge.options ?? {}), [key]: value };
    replaceOptions(next);
  };

  const renameKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return;
    const current = { ...(challenge.options ?? {}) };
    const value = current[oldKey] ?? "";
    delete current[oldKey];
    current[newKey] = value;
    replaceOptions(current);
  };

  const removeKey = (key: string) => {
    const current = { ...(challenge.options ?? {}) };
    delete current[key];
    replaceOptions(current);
  };

  const addFromHint = (optionName: string, defaultValue: string | undefined) => {
    if (challenge.options && optionName in challenge.options) return;
    setValue(optionName, defaultValue ?? "");
  };

  const addBlank = () => {
    let i = 1;
    let key = `option`;
    const existing = challenge.options ?? {};
    while (key in existing) {
      i += 1;
      key = `option${i}`;
    }
    setValue(key, "");
  };

  const unusedHints = hints.filter((h) => !(challenge.options && h.option in challenge.options));

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <div className={styles.titleWrap}>
          <h3 className="sectionLabel">Options</h3>
          <span className={styles.titleNote}>hidden from user</span>
        </div>
        <span className={styles.count}>{entries.length} key{entries.length === 1 ? "" : "s"}</span>
      </header>

      {entries.length === 0 ? (
        <p className={styles.empty}>No options set. All values must be strings.</p>
      ) : (
        <div className={styles.grid}>
          <div className={styles.gridHead}>key</div>
          <div className={styles.gridHead}>value</div>
          <div />
          {entries.map(([key, value]) => {
            const hint = hints.find((h) => h.option === key);
            return (
              <div key={key} className={styles.rowGroup}>
                <div className={styles.row}>
                  <input
                    className={styles.keyInput}
                    defaultValue={key}
                    onBlur={(e) => renameKey(key, e.target.value)}
                  />
                  <input
                    className={styles.valueInput}
                    value={value}
                    placeholder={hint?.placeholder ?? hint?.default ?? ""}
                    onChange={(e) => setValue(key, e.target.value)}
                  />
                  <button type="button" className="danger" onClick={() => removeKey(key)} aria-label="Remove option">
                    ×
                  </button>
                </div>
                {hint?.description ? <div className={styles.hint}>{hint.description}</div> : null}
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.addBar}>
        <button type="button" onClick={addBlank}>
          + Custom option
        </button>
        {unusedHints.length > 0 ? (
          <select
            className={styles.hintSelect}
            defaultValue=""
            onChange={(e) => {
              const name = e.target.value;
              if (!name) return;
              const h = unusedHints.find((x) => x.option === name);
              addFromHint(name, h?.default);
              e.target.value = "";
            }}
          >
            <option value="" disabled>
              + Suggested option…
            </option>
            {unusedHints.map((h) => (
              <option key={h.option} value={h.option}>
                {h.label} ({h.option})
              </option>
            ))}
          </select>
        ) : null}
      </div>
    </section>
  );
}
