import type { PublicationTypeExclude } from "../../../../types/challenges.ts";
import type { WidgetProps } from "../types.ts";
import styles from "./widgets.module.css";

const PUBLICATION_KEYS: ReadonlyArray<readonly [keyof PublicationTypeExclude, string]> = [
  ["post", "post"],
  ["reply", "reply"],
  ["vote", "vote"],
  ["commentEdit", "commentEdit"],
  ["commentModeration", "commentModeration"],
  ["communityEdit", "communityEdit"]
];

export function PublicationTypeChecks({ exclude, onPatch }: WidgetProps) {
  const pubType = exclude.publicationType ?? {};
  const toggle = (key: keyof PublicationTypeExclude, checked: boolean) => {
    const next: PublicationTypeExclude = { ...pubType };
    if (checked) next[key] = true;
    else delete next[key];
    onPatch({ publicationType: Object.keys(next).length ? next : undefined });
  };
  return (
    <div className={styles.pubGrid} role="group" aria-label="Publication types">
      {PUBLICATION_KEYS.map(([key, label]) => (
        <label key={key} className={styles.pubCheck}>
          <input
            type="checkbox"
            checked={pubType[key] === true}
            onChange={(e) => toggle(key, e.target.checked)}
          />
          {label}
        </label>
      ))}
    </div>
  );
}
