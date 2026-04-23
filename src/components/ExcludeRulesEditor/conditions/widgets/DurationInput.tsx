import { useState } from "react";
import type { WidgetProps } from "../types.ts";
import styles from "./widgets.module.css";

type Unit = "s" | "m" | "h" | "d";
const UNIT_SECONDS: Record<Unit, number> = { s: 1, m: 60, h: 3600, d: 86400 };
const UNIT_LABEL: Record<Unit, string> = { s: "seconds", m: "minutes", h: "hours", d: "days" };

function pickUnit(seconds: number): Unit {
  if (seconds > 0 && seconds % 86400 === 0) return "d";
  if (seconds > 0 && seconds % 3600 === 0) return "h";
  if (seconds > 0 && seconds % 60 === 0) return "m";
  return "s";
}

export function DurationInput({ exclude, onPatch }: WidgetProps) {
  const seconds = exclude.firstCommentTimestamp;
  const [unit, setUnit] = useState<Unit>(() => (typeof seconds === "number" ? pickUnit(seconds) : "d"));
  const amount = typeof seconds === "number" ? seconds / UNIT_SECONDS[unit] : "";

  return (
    <div className={styles.inline}>
      <input
        className={styles.numberInput}
        type="number"
        min={0}
        step={1}
        value={amount === "" ? "" : Number.isFinite(amount) ? amount : ""}
        aria-label="Account age amount"
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") {
            onPatch({ firstCommentTimestamp: undefined });
            return;
          }
          const n = Math.max(0, Number(raw));
          if (Number.isNaN(n)) return;
          onPatch({ firstCommentTimestamp: Math.round(n * UNIT_SECONDS[unit]) });
        }}
      />
      <select
        className={styles.unitSelect}
        value={unit}
        aria-label="Account age unit"
        onChange={(e) => {
          const nextUnit = e.target.value as Unit;
          setUnit(nextUnit);
          if (typeof seconds === "number") {
            const keepAmount = seconds / UNIT_SECONDS[unit];
            onPatch({ firstCommentTimestamp: Math.round(keepAmount * UNIT_SECONDS[nextUnit]) });
          }
        }}
      >
        {(Object.keys(UNIT_LABEL) as Unit[]).map((u) => (
          <option key={u} value={u}>
            {UNIT_LABEL[u]}
          </option>
        ))}
      </select>
    </div>
  );
}
