import type { CommunityExclude } from "../../../../types/challenges.ts";
import type { WidgetProps } from "../types.ts";
import { ChipInput } from "../../../ui/ChipInput.tsx";
import styles from "./widgets.module.css";

type NumericSubField = "maxCommentCids" | "postScore" | "replyScore" | "firstCommentTimestamp";

export function CommunityReputationInput({ exclude, onPatch }: WidgetProps) {
  const current: CommunityExclude = exclude.community ?? { addresses: [], maxCommentCids: 100 };

  const patchCommunity = (patch: Partial<CommunityExclude>) => {
    const next: CommunityExclude = { ...current, ...patch };
    onPatch({ community: next });
  };

  const numericRow = (field: NumericSubField, label: string, optional = true) => {
    const val = current[field];
    return (
      <div className={styles.reputationRow} key={field}>
        <span className={styles.reputationLabel}>{label}</span>
        <input
          className={styles.numberInput}
          type="number"
          min={0}
          step={1}
          value={typeof val === "number" ? val : ""}
          aria-label={label}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              if (optional) patchCommunity({ [field]: undefined } as Partial<CommunityExclude>);
              return;
            }
            const n = Math.max(0, Math.floor(Number(raw)));
            if (Number.isNaN(n)) return;
            patchCommunity({ [field]: n } as Partial<CommunityExclude>);
          }}
        />
      </div>
    );
  };

  return (
    <div className={styles.reputationForm}>
      <div className={styles.reputationRow}>
        <span className={styles.reputationLabel}>Addresses</span>
        <div className={styles.reputationChipWrap}>
          <ChipInput
            value={current.addresses ?? []}
            onChange={(next) => patchCommunity({ addresses: next })}
            placeholder="other community address…"
            ariaLabel="Community addresses"
            monospace
          />
        </div>
      </div>
      {numericRow("maxCommentCids", "Max comments", false)}
      {numericRow("postScore", "Post score ≥")}
      {numericRow("replyScore", "Reply score ≥")}
      {numericRow("firstCommentTimestamp", "Account age ≥ (s)")}
    </div>
  );
}
