import type { ComponentType } from "react";
import type { ChallengeExclude, ChallengeSettings } from "../../../types/challenges.ts";

export type ConditionSection = "author" | "request" | "advanced";

export const SECTION_LABELS: Record<ConditionSection, string> = {
  author: "Author reputation",
  request: "Request context",
  advanced: "Advanced"
};

export interface WidgetProps {
  exclude: ChallengeExclude;
  onPatch: (patch: Partial<ChallengeExclude>) => void;
  state: ChallengeSettings;
  challengeIndex: number;
}

export interface ConditionEntry {
  type: string;
  label: string;
  section: ConditionSection;
  isPresent: (e: ChallengeExclude) => boolean;
  clear: () => Partial<ChallengeExclude>;
  seed: () => Partial<ChallengeExclude>;
  Widget: ComponentType<WidgetProps>;
}
