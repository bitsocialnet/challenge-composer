import type { ChallengeExclude } from "../../../../types/challenges.ts";
import type { WidgetProps } from "../types.ts";
import styles from "./widgets.module.css";

type NumericField = "postCount" | "replyCount" | "postScore" | "replyScore";

export function makeNumberWidget(field: NumericField, ariaLabel: string) {
  return function NumberFieldWidget({ exclude, onPatch }: WidgetProps) {
    const val = exclude[field];
    return (
      <input
        className={styles.numberInput}
        type="number"
        min={0}
        step={1}
        value={typeof val === "number" ? val : ""}
        aria-label={ariaLabel}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") {
            onPatch({ [field]: undefined } as Partial<ChallengeExclude>);
            return;
          }
          const n = Math.max(0, Math.floor(Number(raw)));
          onPatch({ [field]: Number.isNaN(n) ? undefined : n } as Partial<ChallengeExclude>);
        }}
      />
    );
  };
}
