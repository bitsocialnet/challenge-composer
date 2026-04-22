import styles from "./ChallengesEditor.module.css";
import { useSettings } from "../../state/useSettingsStore.ts";
import { ChallengeCard } from "../ChallengeCard/ChallengeCard.tsx";

export function ChallengesEditor() {
  const { state, dispatch } = useSettings();

  return (
    <div className={styles.editor}>
      <div className={styles.header}>
        <h2 className={styles.title}>Challenges ({state.length})</h2>
        <button className="primary" type="button" onClick={() => dispatch({ type: "ADD_CHALLENGE" })}>
          + Add challenge
        </button>
      </div>
      <p className={styles.hint}>
        Challenges are evaluated in order; the first that isn't matched by an <code>exclude</code> rule is
        presented to the author. Each <code>exclude</code> entry is a set of conditions — if all are satisfied,
        the author bypasses that challenge.
      </p>
      {state.length === 0 ? (
        <div className={styles.empty}>
          No challenges. Add one, or load a preset from the header.
        </div>
      ) : (
        <ol className={styles.list}>
          {state.map((challenge, index) => (
            <li key={index}>
              <ChallengeCard index={index} challenge={challenge} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
