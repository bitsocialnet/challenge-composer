import { useState } from "react";
import { KNOWN_CHALLENGE_NAMES } from "../../lib/knownChallenges.ts";
import type { CommunityChallengeSetting } from "../../types/challenges.ts";
import { useSettings } from "../../state/useSettingsStore.ts";
import styles from "./ChallengeSourceEditor.module.css";

type Mode = "name" | "path";

interface Props {
  index: number;
  challenge: CommunityChallengeSetting;
}

export function ChallengeSourceEditor({ index, challenge }: Props) {
  const { dispatch } = useSettings();
  const [mode, setMode] = useState<Mode>(challenge.path ? "path" : "name");

  const update = (patch: Partial<CommunityChallengeSetting>) => {
    dispatch({ type: "UPDATE_CHALLENGE", index, patch });
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    if (next === "name") {
      update({ path: undefined, name: challenge.name ?? "captcha-canvas-v3" });
    } else {
      update({ name: undefined, path: challenge.path ?? "./my-challenge.js" });
    }
  };

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h3 className="sectionLabel">Source</h3>
      </header>

      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "name"}
          className={mode === "name" ? styles.tabActive : styles.tab}
          onClick={() => switchMode("name")}
        >
          Built-in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "path"}
          className={mode === "path" ? styles.tabActive : styles.tab}
          onClick={() => switchMode("path")}
        >
          Custom path
        </button>
      </div>

      <div className={styles.fields}>
        {mode === "name" ? (
          <div className={styles.field}>
            <label htmlFor={`name-${index}`}>Name</label>
            <input
              id={`name-${index}`}
              list={`names-${index}`}
              value={challenge.name ?? ""}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="captcha-canvas-v3"
            />
            <datalist id={`names-${index}`}>
              {KNOWN_CHALLENGE_NAMES.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </div>
        ) : (
          <div className={styles.field}>
            <label htmlFor={`path-${index}`}>Challenge file path</label>
            <input
              id={`path-${index}`}
              value={challenge.path ?? ""}
              onChange={(e) => update({ path: e.target.value })}
              placeholder="./my-challenge.js"
            />
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor={`desc-${index}`}>Description (shown to user)</label>
          <input
            id={`desc-${index}`}
            value={challenge.description ?? ""}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="Solve a captcha to post."
          />
        </div>

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={challenge.pendingApproval ?? false}
            onChange={(e) => update({ pendingApproval: e.target.checked })}
          />
          Pending approval (mods must approve publication after solving)
        </label>
      </div>
    </section>
  );
}
