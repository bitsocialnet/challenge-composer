import { useEffect, useRef, useState } from "react";
import type { ChallengeExclude, CommunityChallengeSetting } from "../../types/challenges.ts";
import { useSettings } from "../../state/useSettingsStore.ts";
import { ExcludeGroup } from "./ExcludeGroup.tsx";
import styles from "./ExcludeRulesEditor.module.css";

interface ExcludeRulesEditorProps {
  challengeIndex: number;
  challenge: CommunityChallengeSetting;
}

export function ExcludeRulesEditor({ challengeIndex, challenge }: ExcludeRulesEditorProps) {
  const { state, dispatch } = useSettings();
  const excludes = challenge.exclude ?? [];

  // Each group keeps its key until it is removed, so removing a group leaves the local state of
  // the others (duration units, conditions being edited) with the group it belongs to. Groups are
  // only added and removed here; any other change to the list remounts this editor (see
  // structureVersion in the store).
  const nextKey = useRef(excludes.length);
  const [keys, setKeys] = useState<readonly number[]>(() => excludes.map((_, i) => i));

  // Removing a group destroys its focused "remove group" button. Hand focus to the same button of
  // the group that takes its place, or to "+ Add bypass group" when no group does.
  const groupsRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const focusAfterRemove = useRef<number | null>(null);
  useEffect(() => {
    const index = focusAfterRemove.current;
    if (index === null) return;
    focusAfterRemove.current = null;
    const removeButtons = groupsRef.current?.querySelectorAll<HTMLButtonElement>("[data-remove-group]");
    (removeButtons?.[index] ?? addButtonRef.current)?.focus();
  });

  const patch = (excludeIndex: number, patch: Partial<ChallengeExclude>) => {
    dispatch({ type: "UPDATE_EXCLUDE", challengeIndex, excludeIndex, patch });
  };

  const addGroup = () => {
    const key = nextKey.current++;
    setKeys((prev) => [...prev, key]);
    dispatch({ type: "ADD_EXCLUDE", challengeIndex });
  };
  const removeGroup = (excludeIndex: number) => {
    focusAfterRemove.current = excludeIndex;
    setKeys((prev) => prev.filter((_, i) => i !== excludeIndex));
    dispatch({ type: "REMOVE_EXCLUDE", challengeIndex, excludeIndex });
  };

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h3 className="sectionLabel">Bypass rules</h3>
        <span className={styles.hint}>a user bypasses this challenge if any group matches</span>
      </header>

      {excludes.length === 0 ? (
        <p className={styles.empty}>
          No bypass rules — <strong>everyone</strong> will see this challenge.
        </p>
      ) : (
        <div ref={groupsRef} className={styles.groups}>
          {excludes.map((exclude, idx) => (
            <div key={keys[idx] ?? `at-${idx}`} className={styles.groupSlot}>
              {idx > 0 ? <div className={styles.orDivider}>OR</div> : null}
              <ExcludeGroup
                index={idx}
                total={excludes.length}
                exclude={exclude}
                state={state}
                challengeIndex={challengeIndex}
                onPatch={(p) => patch(idx, p)}
                onRemove={() => removeGroup(idx)}
              />
            </div>
          ))}
        </div>
      )}

      <div className={styles.addBar}>
        <button ref={addButtonRef} type="button" className="subtle" onClick={addGroup}>
          + Add bypass group
        </button>
      </div>
    </section>
  );
}
