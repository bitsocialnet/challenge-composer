import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type Dispatch, type ReactNode } from "react";
import { createElement } from "react";
import type { ChallengeSettings, ChallengeExclude, CommunityChallengeSetting } from "../types/challenges.ts";
import { hydrateInitialState, saveDraft } from "./persistence.ts";

export type SettingsAction =
  | { type: "REPLACE_ALL"; settings: ChallengeSettings }
  | { type: "ADD_CHALLENGE"; challenge?: CommunityChallengeSetting }
  | { type: "REMOVE_CHALLENGE"; index: number }
  | { type: "UPDATE_CHALLENGE"; index: number; patch: Partial<CommunityChallengeSetting> }
  | { type: "MOVE_CHALLENGE"; from: number; to: number }
  | { type: "ADD_EXCLUDE"; challengeIndex: number }
  | { type: "REMOVE_EXCLUDE"; challengeIndex: number; excludeIndex: number }
  | { type: "UPDATE_EXCLUDE"; challengeIndex: number; excludeIndex: number; patch: Partial<ChallengeExclude> };

function reducer(state: ChallengeSettings, action: SettingsAction): ChallengeSettings {
  switch (action.type) {
    case "REPLACE_ALL":
      return [...action.settings];
    case "ADD_CHALLENGE":
      return [...state, action.challenge ?? { name: "captcha-canvas-v3" }];
    case "REMOVE_CHALLENGE":
      return state.filter((_, i) => i !== action.index);
    case "UPDATE_CHALLENGE":
      return state.map((c, i) => (i === action.index ? cleanChallenge({ ...c, ...action.patch }) : c));
    case "MOVE_CHALLENGE": {
      if (action.from === action.to) return state;
      const next = [...state];
      const [moved] = next.splice(action.from, 1);
      if (!moved) return state;
      next.splice(action.to, 0, moved);
      return next;
    }
    case "ADD_EXCLUDE":
      return state.map((c, i) => {
        if (i !== action.challengeIndex) return c;
        const existing = c.exclude ?? [];
        return { ...c, exclude: [...existing, {}] as ChallengeSettings[number]["exclude"] };
      });
    case "REMOVE_EXCLUDE":
      return state.map((c, i) => {
        if (i !== action.challengeIndex) return c;
        const existing = c.exclude ?? [];
        const filtered = existing.filter((_, j) => j !== action.excludeIndex);
        return cleanChallenge({ ...c, exclude: filtered.length ? filtered : undefined } as CommunityChallengeSetting);
      });
    case "UPDATE_EXCLUDE":
      return state.map((c, i) => {
        if (i !== action.challengeIndex) return c;
        const existing = c.exclude ?? [];
        const nextExcludes = existing.map((e, j) => (j === action.excludeIndex ? cleanExclude({ ...e, ...action.patch }) : e));
        return { ...c, exclude: nextExcludes } as CommunityChallengeSetting;
      });
    default:
      return state;
  }
}

function cleanChallenge(c: CommunityChallengeSetting): CommunityChallengeSetting {
  const next: CommunityChallengeSetting = { ...c };
  if (next.options && Object.keys(next.options).length === 0) delete next.options;
  if (next.exclude && next.exclude.length === 0) delete next.exclude;
  if (next.description === "") delete next.description;
  if (next.pendingApproval === false) delete next.pendingApproval;
  if (next.path === "") delete next.path;
  if (next.name === "") delete next.name;
  return next;
}

function cleanExclude(e: ChallengeExclude): ChallengeExclude {
  const next: ChallengeExclude = { ...e };
  if (next.role && next.role.length === 0) delete next.role;
  if (next.address && next.address.length === 0) delete next.address;
  if (next.challenges && next.challenges.length === 0) delete next.challenges;
  if (next.publicationType && Object.keys(next.publicationType).length === 0) delete next.publicationType;
  return next;
}

interface SettingsContextValue {
  state: ChallengeSettings;
  dispatch: Dispatch<SettingsAction>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
  initialState?: ChallengeSettings;
}

export function SettingsProvider({ children, initialState }: SettingsProviderProps) {
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState ?? hydrateInitialState());

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    saveDraft(state);
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return createElement(SettingsContext.Provider, { value }, children);
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside <SettingsProvider>");
  return ctx;
}
