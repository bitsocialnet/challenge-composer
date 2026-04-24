import { useState } from "react";
import styles from "./ChallengesEditor.module.css";
import { useSettings } from "../../state/useSettingsStore.ts";
import { ChallengeRow } from "../ChallengeRow/ChallengeRow.tsx";
import { Menu, type MenuItem } from "../ui/Menu.tsx";
import { BUILTIN_CHALLENGES, EXTERNAL_CHALLENGES } from "../../lib/knownChallenges.ts";
import { PRESETS, type Preset } from "../../presets/index.ts";
import { parseJsonc } from "../../lib/jsonc.ts";
import { CommunityChallengeSettingSchema } from "../../pkc-schema.ts";
import type { CommunityChallengeSetting } from "../../types/challenges.ts";

const ChallengeSettingsArraySchema = CommunityChallengeSettingSchema.array();

export function ChallengesEditor() {
  const { state, dispatch } = useSettings();
  const [collapsed, setCollapsed] = useState<Set<number>>(() => new Set());

  const toggle = (index: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const addChallenge = (challenge?: CommunityChallengeSetting) => {
    dispatch({ type: "ADD_CHALLENGE", challenge });
  };

  const removeChallenge = (index: number) => {
    if (!confirm(`Remove challenge #${index + 1}?`)) return;
    dispatch({ type: "REMOVE_CHALLENGE", index });
    setCollapsed((prev) => {
      const next = new Set<number>();
      for (const c of prev) {
        if (c < index) next.add(c);
        else if (c > index) next.add(c - 1);
      }
      return next;
    });
  };

  const move = (from: number, to: number) => {
    dispatch({ type: "MOVE_CHALLENGE", from, to });
    setCollapsed((prev) => {
      const next = new Set<number>();
      for (const c of prev) {
        if (c === from) next.add(to);
        else if (from < to && c > from && c <= to) next.add(c - 1);
        else if (from > to && c >= to && c < from) next.add(c + 1);
        else next.add(c);
      }
      return next;
    });
  };

  const loadPreset = (preset: Preset) => {
    const { value, errors } = parseJsonc(preset.jsonc);
    if (errors.length) {
      alert(`Preset parse error: ${errors.join(", ")}`);
      return;
    }
    const parsed = ChallengeSettingsArraySchema.safeParse(value);
    if (!parsed.success) {
      alert(`Preset validation failed: ${parsed.error.message}`);
      return;
    }
    dispatch({ type: "REPLACE_ALL", settings: parsed.data });
  };

  const addMenuItems: MenuItem[] = [
    ...BUILTIN_CHALLENGES.map((c) => ({
      id: `builtin-${c.name}`,
      section: "Built-in (pkc-js)",
      label: c.name,
      onSelect: () => addChallenge({ name: c.name })
    })),
    ...EXTERNAL_CHALLENGES.filter((c) => c.packageName).map((c) => ({
      id: `ext-${c.packageName}`,
      section: "External (install required)",
      label: `${c.name} — ${c.packageName}`,
      onSelect: () => addChallenge({ path: c.packageName })
    })),
    {
      id: "custom-path",
      section: "Custom",
      label: "Custom path…",
      onSelect: () => addChallenge({ path: "./my-challenge.js" })
    }
  ];

  const nonEmptyPresets = PRESETS.filter((p) => p.id !== "empty");

  return (
    <div className={styles.editor}>
      <header className={styles.paneHeader}>
        <h2 className={styles.title}>Challenges ({state.length})</h2>
        <div className={styles.addGroup}>
          <button className={`primary ${styles.addMain}`} type="button" onClick={() => addChallenge()}>
            + Add challenge
          </button>
          <Menu
            align="right"
            items={addMenuItems}
            menuLabel="Add challenge by type"
            trigger={({ toggle, ariaProps }) => (
              <button
                type="button"
                className={`primary ${styles.addCaret}`}
                onClick={toggle}
                aria-label="More add options"
                {...ariaProps}
              >
                ▾
              </button>
            )}
          />
        </div>
      </header>

      {state.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No challenges configured</p>
          <p className={styles.emptyBody}>
            Add a challenge to gate publications in this community. Challenges are evaluated in order; the
            first not matched by a bypass rule is presented to the author.
          </p>
          <div className={styles.emptyActions}>
            <Menu
              items={addMenuItems}
              menuLabel="Add challenge by type"
              trigger={({ toggle, ariaProps }) => (
                <button type="button" className="primary" onClick={toggle} {...ariaProps}>
                  + Add built-in ▾
                </button>
              )}
            />
            <button type="button" onClick={() => addChallenge({ path: "./my-challenge.js" })}>
              + Add custom path
            </button>
          </div>
          <div className={styles.presetChips}>
            <span className={styles.presetsLabel}>Or try a preset:</span>
            {nonEmptyPresets.map((p) => (
              <button
                key={p.id}
                type="button"
                className="subtle sm"
                title={p.description}
                onClick={() => loadPreset(p)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <ol className={styles.list}>
          {state.map((challenge, index) => (
            <li key={index}>
              <ChallengeRow
                index={index}
                challenge={challenge}
                isOpen={!collapsed.has(index)}
                canMoveUp={index > 0}
                canMoveDown={index < state.length - 1}
                onToggle={() => toggle(index)}
                onMoveUp={() => move(index, index - 1)}
                onMoveDown={() => move(index, index + 1)}
                onRemove={() => removeChallenge(index)}
              />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
