import type { WidgetProps } from "../types.ts";
import styles from "./widgets.module.css";

export function RateLimitInput({ exclude, onPatch }: WidgetProps) {
  const val = exclude.rateLimit;
  return (
    <div className={styles.inline}>
      <input
        className={styles.numberInput}
        type="number"
        min={0}
        step={1}
        value={typeof val === "number" ? val : ""}
        aria-label="Rate limit per hour"
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") {
            onPatch({ rateLimit: undefined });
            return;
          }
          const n = Math.max(0, Math.floor(Number(raw)));
          if (Number.isNaN(n)) return;
          onPatch({ rateLimit: n });
        }}
      />
      <span className={styles.reputationLabel}>per hour</span>
      <label className={styles.modToggle}>
        <input
          type="checkbox"
          checked={exclude.rateLimitChallengeSuccess === true}
          onChange={(e) => onPatch({ rateLimitChallengeSuccess: e.target.checked || undefined })}
        />
        count only successful challenges
      </label>
    </div>
  );
}
