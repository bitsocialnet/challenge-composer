import { useState } from "react";
import { BUILTIN_CHALLENGES, EXTERNAL_CHALLENGES } from "../../lib/knownChallenges.ts";
import type { CommunityChallengeSetting } from "../../types/challenges.ts";
import { useSettings } from "../../state/useSettingsStore.ts";
import styles from "./ChallengeSourceEditor.module.css";

type Mode = "known" | "path";

interface Props {
  index: number;
  challenge: CommunityChallengeSetting;
}

const KNOWN_EXTERNAL_PACKAGES = new Set(
  EXTERNAL_CHALLENGES.map((c) => c.packageName).filter((p): p is string => Boolean(p))
);
const KNOWN_BUILTIN_NAMES = new Set(BUILTIN_CHALLENGES.map((c) => c.name));

function isKnown(challenge: CommunityChallengeSetting): boolean {
  if (challenge.path) return KNOWN_EXTERNAL_PACKAGES.has(challenge.path);
  if (challenge.name) return KNOWN_BUILTIN_NAMES.has(challenge.name);
  return true; // empty → treat as "known" so user starts in the dropdown tab
}

export function ChallengeSourceEditor({ index, challenge }: Props) {
  const { dispatch } = useSettings();
  const [mode, setMode] = useState<Mode>(isKnown(challenge) ? "known" : "path");

  const update = (patch: Partial<CommunityChallengeSetting>) => {
    dispatch({ type: "UPDATE_CHALLENGE", index, patch });
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    if (next === "known") {
      // Seed to first built-in if nothing recognised is selected.
      if (!isKnown(challenge)) {
        update({ path: undefined, name: BUILTIN_CHALLENGES[0]?.name ?? "text-math" });
      }
    } else {
      update({ name: undefined, path: challenge.path ?? "./my-challenge.js" });
    }
  };

  const onPickKnown = (value: string) => {
    if (value.startsWith("builtin:")) {
      update({ name: value.slice("builtin:".length), path: undefined });
    } else if (value.startsWith("ext:")) {
      update({ name: undefined, path: value.slice("ext:".length) });
    }
  };

  const currentKnownValue = challenge.path && KNOWN_EXTERNAL_PACKAGES.has(challenge.path)
    ? `ext:${challenge.path}`
    : challenge.name && KNOWN_BUILTIN_NAMES.has(challenge.name)
    ? `builtin:${challenge.name}`
    : "";

  const selectedExternal = challenge.path
    ? EXTERNAL_CHALLENGES.find((c) => c.packageName === challenge.path)
    : undefined;

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h3 className="sectionLabel">Source</h3>
      </header>

      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "known"}
          className={mode === "known" ? styles.tabActive : styles.tab}
          onClick={() => switchMode("known")}
        >
          Known
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
        {mode === "known" ? (
          <div className={styles.field}>
            <label htmlFor={`known-${index}`}>Challenge</label>
            <select
              id={`known-${index}`}
              value={currentKnownValue}
              onChange={(e) => onPickKnown(e.target.value)}
            >
              <option value="" disabled>
                Pick a challenge…
              </option>
              <optgroup label="Built-in (pkc-js)">
                {BUILTIN_CHALLENGES.map((c) => (
                  <option key={c.name} value={`builtin:${c.name}`}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="External (install required)">
                {EXTERNAL_CHALLENGES.filter((c) => c.packageName).map((c) => (
                  <option key={c.packageName} value={`ext:${c.packageName}`}>
                    {c.name} — {c.packageName}
                  </option>
                ))}
              </optgroup>
            </select>
            {selectedExternal ? (
              <p className="hint">
                Install before use: <code>bitsocial challenge install {selectedExternal.packageName}</code>
              </p>
            ) : null}
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
