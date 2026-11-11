import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type Dispatch, type ReactNode } from "react";
import { createElement } from "react";
import type { ChallengeSettings, ChallengeExclude, CommunityChallengeSetting } from "../types/challenges.ts";
import { clearShareHash, hydrateInitialState, saveDraft } from "./persistence.ts";

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
      return [...state, action.challenge ?? { name: "text-math" }];
    case "REMOVE_CHALLENGE": {
      const { index } = action;
      const next = state.filter((_, i) => i !== index);
      return remapChallengeRefs(next, state.length, (i) => (i === index ? undefined : i > index ? i - 1 : i));
    }
    case "UPDATE_CHALLENGE":
      return state.map((c, i) => (i === action.index ? cleanChallenge({ ...c, ...action.patch }) : c));
    case "MOVE_CHALLENGE": {
      const { from, to } = action;
      if (from === to) return state;
      const next = [...state];
      const [moved] = next.splice(from, 1);
      if (!moved) return state;
      next.splice(to, 0, moved);
      return remapChallengeRefs(next, state.length, (i) => {
        if (i === from) return to;
        if (from < to && i > from && i <= to) return i - 1;
        if (from > to && i >= to && i < from) return i + 1;
        return i;
      });
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

// exclude[].challenges holds positions in the challenges array, so after a move or removal each
// reference must follow the challenge it named. `newIndexOf` maps an old position to its new one,
// or to undefined for a removed challenge; indices that were already out of range stay as they are.
// "Passed every one of these challenges" can never be met once one of them is gone, so that
// condition is dropped rather than narrowed to the rest (which would widen the bypass), and a group
// left with no fields at all is dropped too (pkc-js checks `challenges` on its own, so this keeps
// what the config does).
function remapChallengeRefs(
  settings: ChallengeSettings,
  oldLength: number,
  newIndexOf: (oldIndex: number) => number | undefined
): ChallengeSettings {
  const mapIndex = (i: number) => (i >= 0 && i < oldLength ? newIndexOf(i) : i);
  return settings.map((c) => {
    if (!c.exclude?.some((e) => Array.isArray(e.challenges) && e.challenges.length > 0)) return c;
    const exclude: ChallengeExclude[] = [];
    for (const e of c.exclude) {
      if (!Array.isArray(e.challenges) || e.challenges.length === 0) {
        exclude.push(e);
        continue;
      }
      const mapped = e.challenges.map(mapIndex);
      if (mapped.every((i): i is number => i !== undefined)) {
        exclude.push({ ...e, challenges: mapped });
        continue;
      }
      const rest: ChallengeExclude = { ...e };
      delete rest.challenges;
      // Cleared conditions stay in the group as undefined keys (see UPDATE_EXCLUDE).
      if (Object.values(rest).some((v) => v !== undefined)) exclude.push(rest);
    }
    const next: CommunityChallengeSetting = { ...c };
    if (exclude.length > 0) next.exclude = exclude as CommunityChallengeSetting["exclude"];
    else delete next.exclude;
    return next;
  });
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
  if (next.community) {
    const c = next.community;
    const hasAddresses = Array.isArray(c.addresses) && c.addresses.length > 0;
    const hasOther =
      typeof c.maxCommentCids === "number" ||
      typeof c.postScore === "number" ||
      typeof c.replyScore === "number" ||
      typeof c.firstCommentTimestamp === "number";
    if (!hasAddresses && !hasOther) delete next.community;
  }
  return next;
}

// Actions after which a row position can hold a different challenge. Removing one bypass group is
// not among them: the bypass rules editor keys its groups by identity and handles that itself.
const STRUCTURAL_ACTIONS: ReadonlySet<SettingsAction["type"]> = new Set([
  "REPLACE_ALL",
  "MOVE_CHALLENGE",
  "REMOVE_CHALLENGE"
]);

interface StoreState {
  settings: ChallengeSettings;
  structureVersion: number;
}

function storeReducer(store: StoreState, action: SettingsAction): StoreState {
  const settings = reducer(store.settings, action);
  if (settings === store.settings) return store;
  const structureVersion = STRUCTURAL_ACTIONS.has(action.type) ? store.structureVersion + 1 : store.structureVersion;
  return { settings, structureVersion };
}

interface SettingsContextValue {
  state: ChallengeSettings;
  dispatch: Dispatch<SettingsAction>;
  // Changes whenever rows may now show a different challenge. Rows are keyed by position, so
  // editors that keep local state derived from their data (source tab, duration unit) use it as a
  // key to remount and derive that state again.
  structureVersion: number;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
  initialState?: ChallengeSettings;
}

export function SettingsProvider({ children, initialState }: SettingsProviderProps) {
  const [{ settings: state, structureVersion }, dispatch] = useReducer(storeReducer, undefined, () => ({
    settings: initialState ?? hydrateInitialState(),
    structureVersion: 0
  }));

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (saveDraft(state)) clearShareHash();
  }, [state]);

  const value = useMemo(() => ({ state, dispatch, structureVersion }), [state, structureVersion]);
  return createElement(SettingsContext.Provider, { value }, children);
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside <SettingsProvider>");
  return ctx;
}
