import { useId } from "react";
import type { CommunityChallengeSetting } from "../../types/challenges.ts";
import { OptionsEditor } from "../OptionsEditor/OptionsEditor.tsx";
import { ExcludeRulesEditor } from "../ExcludeRulesEditor/ExcludeRulesEditor.tsx";
import { ChallengeSourceEditor } from "./ChallengeSourceEditor.tsx";
import { summarize } from "./challengeSummary.ts";
import styles from "./ChallengeRow.module.css";

interface ChallengeRowProps {
  index: number;
  challenge: CommunityChallengeSetting;
  isOpen: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

export function ChallengeRow({
  index,
  challenge,
  isOpen,
  canMoveUp,
  canMoveDown,
  onToggle,
  onMoveUp,
  onMoveDown,
  onRemove
}: ChallengeRowProps) {
  const bodyId = useId();
  const titleId = useId();
  const displayName = challenge.name ?? challenge.path ?? "(unnamed)";
  const summary = summarize(challenge);

  return (
    <article className={styles.row} aria-labelledby={titleId}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={isOpen}
          aria-controls={bodyId}
          onClick={onToggle}
        >
          <span className={styles.chevron} aria-hidden="true">
            {isOpen ? "▾" : "▸"}
          </span>
          <span className={styles.badge}>#{index + 1}</span>
          <span id={titleId} className={styles.title}>
            {displayName}
          </span>
          {!isOpen && summary ? <span className={styles.summary}>{summary}</span> : null}
        </button>
        <div className={styles.actions}>
          <button
            type="button"
            className="ghost sm"
            aria-label="Move up"
            onClick={onMoveUp}
            disabled={!canMoveUp}
          >
            ↑
          </button>
          <button
            type="button"
            className="ghost sm"
            aria-label="Move down"
            onClick={onMoveDown}
            disabled={!canMoveDown}
          >
            ↓
          </button>
          <button type="button" className="ghost sm" aria-label="Remove" onClick={onRemove}>
            ×
          </button>
        </div>
      </div>

      {isOpen ? (
        <div id={bodyId} className={styles.body}>
          <ChallengeSourceEditor index={index} challenge={challenge} />
          <OptionsEditor challengeIndex={index} challenge={challenge} />
          <ExcludeRulesEditor challengeIndex={index} challenge={challenge} />
        </div>
      ) : null}
    </article>
  );
}
