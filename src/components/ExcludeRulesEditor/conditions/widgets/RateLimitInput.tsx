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
      <span className={styles.reputationLabel}>per hour, counting</span>
      {/* pkc-js counts successful challenges unless rateLimitChallengeSuccess is false. */}
      <select
        className={styles.unitSelect}
        value={exclude.rateLimitChallengeSuccess === false ? "failed" : "successful"}
        aria-label="Rate limit counts"
        onChange={(e) => onPatch({ rateLimitChallengeSuccess: e.target.value === "successful" })}
      >
        <option value="successful">successful challenges</option>
        <option value="failed">failed challenges</option>
      </select>
    </div>
  );
}
