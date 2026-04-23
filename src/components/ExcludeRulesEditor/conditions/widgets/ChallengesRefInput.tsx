import { useMemo } from "react";
import type { WidgetProps } from "../types.ts";
import { ChipInput } from "../../../ui/ChipInput.tsx";

export function ChallengesRefInput({ exclude, onPatch, state, challengeIndex }: WidgetProps) {
  const current = exclude.challenges ?? [];

  const { suggestions, labelByToken, tokenByIndex } = useMemo(() => {
    const suggestions: string[] = [];
    const labelByToken = new Map<string, number>();
    const tokenByIndex = new Map<number, string>();
    state.forEach((c, i) => {
      if (i === challengeIndex) return;
      const displayName = c.name ?? c.path ?? "(unnamed)";
      const token = `#${i + 1} ${displayName}`;
      suggestions.push(token);
      labelByToken.set(token, i);
      tokenByIndex.set(i, token);
    });
    return { suggestions, labelByToken, tokenByIndex };
  }, [state, challengeIndex]);

  const tokens: string[] = current
    .map((idx) => tokenByIndex.get(idx) ?? `#${idx + 1}`)
    .filter((t) => t != null);

  return (
    <ChipInput
      value={tokens}
      onChange={(nextTokens) => {
        const next: number[] = [];
        for (const t of nextTokens) {
          if (labelByToken.has(t)) {
            const i = labelByToken.get(t)!;
            if (!next.includes(i)) next.push(i);
            continue;
          }
          const m = t.match(/^#(\d+)/);
          if (m) {
            const idx = Number(m[1]) - 1;
            if (idx >= 0 && idx < state.length && idx !== challengeIndex && !next.includes(idx)) next.push(idx);
          }
        }
        onPatch({ challenges: next.length ? next : undefined });
      }}
      suggestions={suggestions}
      placeholder="Pick a challenge by #N…"
      ariaLabel="Passed challenges"
    />
  );
}
