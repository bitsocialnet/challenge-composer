import type { ChallengeExclude, ChallengeSettings } from "../../../types/challenges.ts";
import type { ConditionEntry } from "./types.ts";
import styles from "./ConditionRow.module.css";

interface ConditionRowProps {
  entry: ConditionEntry;
  exclude: ChallengeExclude;
  onPatch: (patch: Partial<ChallengeExclude>) => void;
  state: ChallengeSettings;
  challengeIndex: number;
  connector?: string;
}

export function ConditionRow({ entry, exclude, onPatch, state, challengeIndex, connector }: ConditionRowProps) {
  const { Widget } = entry;
  return (
    <div className={styles.row}>
      {connector ? <span className={styles.connector}>{connector}</span> : <span className={styles.connectorSpacer} />}
      <span className={styles.label}>{entry.label}</span>
      <div className={styles.widget}>
        <Widget exclude={exclude} onPatch={onPatch} state={state} challengeIndex={challengeIndex} />
      </div>
      <button
        type="button"
        className={`ghost sm ${styles.remove}`}
        aria-label={`Remove condition ${entry.label}`}
        onClick={() => onPatch(entry.clear())}
      >
        ×
      </button>
    </div>
  );
}
