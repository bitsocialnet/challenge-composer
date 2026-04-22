import { useState } from "react";
import styles from "./ChallengeCard.module.css";
import { KNOWN_CHALLENGE_NAMES } from "../../lib/knownChallenges.ts";
import type { CommunityChallengeSetting } from "../../types/challenges.ts";
import { useSettings } from "../../state/useSettingsStore.ts";
import { OptionsEditor } from "../OptionsEditor/OptionsEditor.tsx";
import { ExcludeRulesEditor } from "../ExcludeRulesEditor/ExcludeRulesEditor.tsx";

interface ChallengeCardProps {
  index: number;
  challenge: CommunityChallengeSetting;
}

type Mode = "name" | "path";

export function ChallengeCard({ index, challenge }: ChallengeCardProps) {
  const { dispatch } = useSettings();
  const [mode, setMode] = useState<Mode>(challenge.path ? "path" : "name");

  const update = (patch: Partial<CommunityChallengeSetting>) => {
    dispatch({ type: "UPDATE_CHALLENGE", index, patch });
  };

  const remove = () => {
    if (!confirm(`Remove challenge #${index + 1}?`)) return;
    dispatch({ type: "REMOVE_CHALLENGE", index });
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
    <article className={styles.card}>
      <header className={styles.header}>
        <span className={styles.badge}>#{index + 1}</span>
        <span className={styles.summary}>
          {challenge.name ?? challenge.path ?? <em>no name</em>}
          {challenge.pendingApproval ? <span className={styles.pending}>pending approval</span> : null}
        </span>
        <button type="button" className="danger" onClick={remove}>
          Remove
        </button>
      </header>

      <div className={styles.field}>
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
            Custom (path)
          </button>
        </div>
        {mode === "name" ? (
          <>
            <label htmlFor={`name-${index}`}>Challenge name</label>
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
          </>
        ) : (
          <>
            <label htmlFor={`path-${index}`}>Challenge file path</label>
            <input
              id={`path-${index}`}
              value={challenge.path ?? ""}
              onChange={(e) => update({ path: e.target.value })}
              placeholder="./my-challenge.js"
            />
          </>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor={`desc-${index}`}>Description (shown to user)</label>
        <input
          id={`desc-${index}`}
          value={challenge.description ?? ""}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="Solve a captcha to post."
        />
      </div>

      <div className={styles.fieldRow}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={challenge.pendingApproval ?? false}
            onChange={(e) => update({ pendingApproval: e.target.checked })}
          />
          Pending approval (mods must approve publication after solving)
        </label>
      </div>

      <OptionsEditor challengeIndex={index} challenge={challenge} />
      <ExcludeRulesEditor challengeIndex={index} challenge={challenge} />
    </article>
  );
}
