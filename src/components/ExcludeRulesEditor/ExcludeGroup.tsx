import { useMemo } from "react";
import type { ChallengeExclude, ChallengeSettings } from "../../types/challenges.ts";
import { Menu, type MenuItem } from "../ui/Menu.tsx";
import { CONDITION_REGISTRY } from "./conditions/conditionRegistry.tsx";
import { SECTION_LABELS } from "./conditions/types.ts";
import { ConditionRow } from "./conditions/ConditionRow.tsx";
import styles from "./ExcludeGroup.module.css";

interface ExcludeGroupProps {
  index: number;
  total: number;
  exclude: ChallengeExclude;
  state: ChallengeSettings;
  challengeIndex: number;
  onPatch: (patch: Partial<ChallengeExclude>) => void;
  onRemove: () => void;
}

export function ExcludeGroup({ index, total, exclude, state, challengeIndex, onPatch, onRemove }: ExcludeGroupProps) {
  const activeEntries = useMemo(
    () => CONDITION_REGISTRY.filter((entry) => entry.isPresent(exclude)),
    [exclude]
  );

  const menuItems: MenuItem[] = useMemo(
    () =>
      CONDITION_REGISTRY.filter((entry) => !entry.isPresent(exclude)).map((entry) => ({
        id: entry.type,
        label: entry.label,
        section: SECTION_LABELS[entry.section],
        onSelect: () => onPatch(entry.seed())
      })),
    [exclude, onPatch]
  );

  const isEmpty = activeEntries.length === 0;

  return (
    <div className={styles.group} aria-label={`Bypass group ${index + 1}`}>
      <div className={styles.groupHeader}>
        <span className={styles.groupLabel}>
          Group {index + 1} of {total}
        </span>
        <button type="button" className="ghost sm" aria-label="Remove group" onClick={onRemove}>
          × remove group
        </button>
      </div>

      {isEmpty ? (
        <p className={styles.emptyGroup}>
          Empty group — matches everyone, bypassing this challenge for all authors.
        </p>
      ) : (
        <div className={styles.conditions}>
          {activeEntries.map((entry, i) => (
            <ConditionRow
              key={entry.type}
              entry={entry}
              exclude={exclude}
              onPatch={onPatch}
              state={state}
              challengeIndex={challengeIndex}
              connector={i === 0 ? "WHEN" : "AND"}
            />
          ))}
        </div>
      )}

      <div className={styles.addBar}>
        <Menu
          items={menuItems}
          menuLabel="Add condition"
          trigger={({ toggle, ariaProps }) => (
            <button
              type="button"
              className="subtle sm"
              onClick={toggle}
              disabled={menuItems.length === 0}
              {...ariaProps}
            >
              + Add condition ▾
            </button>
          )}
        />
      </div>
    </div>
  );
}
