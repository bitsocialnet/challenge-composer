import styles from "./ExcludeRulesEditor.module.css";
import type { ChallengeExclude, CommunityChallengeSetting, PublicationTypeExclude } from "../../types/challenges.ts";
import { useSettings } from "../../state/useSettingsStore.ts";

interface ExcludeRulesEditorProps {
  challengeIndex: number;
  challenge: CommunityChallengeSetting;
}

const PUBLICATION_KEYS = [
  ["post", "Post"],
  ["reply", "Reply"],
  ["vote", "Vote"],
  ["commentEdit", "Comment edit"],
  ["commentModeration", "Comment moderation"],
  ["communityEdit", "Community edit"]
] as const satisfies ReadonlyArray<readonly [keyof PublicationTypeExclude, string]>;

export function ExcludeRulesEditor({ challengeIndex, challenge }: ExcludeRulesEditorProps) {
  const { dispatch } = useSettings();
  const excludes = challenge.exclude ?? [];

  const update = (excludeIndex: number, patch: Partial<ChallengeExclude>) => {
    dispatch({ type: "UPDATE_EXCLUDE", challengeIndex, excludeIndex, patch });
  };

  const add = () => dispatch({ type: "ADD_EXCLUDE", challengeIndex });
  const remove = (excludeIndex: number) => dispatch({ type: "REMOVE_EXCLUDE", challengeIndex, excludeIndex });

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h3 className={styles.title}>Exclude rules</h3>
        <button type="button" onClick={add}>
          + Add exclude group
        </button>
      </header>
      {excludes.length === 0 ? (
        <p className={styles.empty}>
          No exclude rules. <strong>Everyone</strong> will see this challenge.
        </p>
      ) : (
        <ul className={styles.list}>
          {excludes.map((exclude, idx) => (
            <li key={idx}>
              <ExcludeGroup
                index={idx}
                exclude={exclude}
                onUpdate={(patch) => update(idx, patch)}
                onRemove={() => remove(idx)}
              />
            </li>
          ))}
        </ul>
      )}
      <p className={styles.hint}>
        A user bypasses this challenge if <em>any one</em> exclude group matches them (all conditions inside
        that group must be satisfied).
      </p>
    </section>
  );
}

interface ExcludeGroupProps {
  index: number;
  exclude: ChallengeExclude;
  onUpdate: (patch: Partial<ChallengeExclude>) => void;
  onRemove: () => void;
}

function ExcludeGroup({ index, exclude, onUpdate, onRemove }: ExcludeGroupProps) {
  const numField = (key: keyof ChallengeExclude, label: string, hint?: string) => (
    <div className={styles.field}>
      <label htmlFor={`ex-${index}-${String(key)}`}>{label}</label>
      <input
        id={`ex-${index}-${String(key)}`}
        type="number"
        value={typeof exclude[key] === "number" ? (exclude[key] as number) : ""}
        onChange={(e) => {
          const v = e.target.value;
          onUpdate({ [key]: v === "" ? undefined : Number(v) } as Partial<ChallengeExclude>);
        }}
      />
      {hint ? <small className={styles.hint}>{hint}</small> : null}
    </div>
  );

  const csvField = (key: "role" | "address", label: string, hint?: string) => (
    <div className={styles.field}>
      <label htmlFor={`ex-${index}-${key}`}>{label}</label>
      <input
        id={`ex-${index}-${key}`}
        value={(exclude[key] ?? []).join(", ")}
        onChange={(e) => {
          const v = e.target.value
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
          onUpdate({ [key]: v.length ? v : undefined } as Partial<ChallengeExclude>);
        }}
        placeholder="moderator, admin, owner"
      />
      {hint ? <small className={styles.hint}>{hint}</small> : null}
    </div>
  );

  const pubType = exclude.publicationType ?? {};
  const togglePubKey = (key: keyof PublicationTypeExclude, checked: boolean) => {
    const next: PublicationTypeExclude = { ...pubType };
    if (checked) next[key] = true;
    else delete next[key];
    onUpdate({ publicationType: Object.keys(next).length ? next : undefined });
  };

  return (
    <div className={styles.group}>
      <div className={styles.groupHeader}>
        <span className={styles.groupBadge}>group {index + 1}</span>
        <button type="button" className="danger" onClick={onRemove}>
          Remove group
        </button>
      </div>

      <div className={styles.fields}>
        {csvField("role", "Roles (comma-separated)", "Match if author has any of these roles.")}
        {numField("postCount", "postCount ≥", "Require author has posted this many top-level comments.")}
        {numField("replyCount", "replyCount ≥", "Require author has posted this many replies.")}
        {numField("postScore", "postScore ≥", "Require author has this much post karma.")}
        {numField("replyScore", "replyScore ≥", "Require author has this much reply karma.")}
        {numField("firstCommentTimestamp", "firstCommentTimestamp (seconds)", "Require account age ≥ N seconds.")}
        {numField("rateLimit", "rateLimit (per hour)", "Match while author is below this publishing rate.")}
        <div className={styles.field}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={exclude.rateLimitChallengeSuccess === true}
              onChange={(e) => onUpdate({ rateLimitChallengeSuccess: e.target.checked || undefined })}
            />
            rateLimitChallengeSuccess
          </label>
          <small className={styles.hint}>If checked, rateLimit counts only successful challenges.</small>
        </div>
        {csvField("address", "Author addresses", "Match if author address is in this list.")}
      </div>

      <div className={styles.pubTypeSection}>
        <label>publicationType (OR)</label>
        <div className={styles.pubTypeGrid}>
          {PUBLICATION_KEYS.map(([key, label]) => (
            <label key={key} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={pubType[key] === true}
                onChange={(e) => togglePubKey(key, e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
