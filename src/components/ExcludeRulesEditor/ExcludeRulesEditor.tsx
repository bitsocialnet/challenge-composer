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

  const patch = (excludeIndex: number, patch: Partial<ChallengeExclude>) => {
    dispatch({ type: "UPDATE_EXCLUDE", challengeIndex, excludeIndex, patch });
  };

  const addGroup = () => dispatch({ type: "ADD_EXCLUDE", challengeIndex });
  const removeGroup = (excludeIndex: number) =>
    dispatch({ type: "REMOVE_EXCLUDE", challengeIndex, excludeIndex });

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
        <div className={styles.groups}>
          {excludes.map((exclude, idx) => (
            <div key={idx} className={styles.groupSlot}>
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
        <button type="button" className="subtle" onClick={addGroup}>
          + Add bypass group
        </button>
      </div>
    </section>
  );
}
