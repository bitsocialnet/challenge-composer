import type { ConditionEntry } from "./types.ts";
import { makeNumberWidget } from "./widgets/NumberInput.tsx";
import { DurationInput } from "./widgets/DurationInput.tsx";
import { RateLimitInput } from "./widgets/RateLimitInput.tsx";
import { RoleChips } from "./widgets/RoleChips.tsx";
import { AddressListInput } from "./widgets/AddressListInput.tsx";
import { PublicationTypeChecks } from "./widgets/PublicationTypeChecks.tsx";
import { ChallengesRefInput } from "./widgets/ChallengesRefInput.tsx";
import { CommunityReputationInput } from "./widgets/CommunityReputationInput.tsx";

export const CONDITION_REGISTRY: ConditionEntry[] = [
  {
    type: "postCount",
    label: "Posts ≥",
    section: "author",
    isPresent: (e) => typeof e.postCount === "number",
    clear: () => ({ postCount: undefined }),
    seed: () => ({ postCount: 1 }),
    Widget: makeNumberWidget("postCount", "Posts threshold")
  },
  {
    type: "replyCount",
    label: "Replies ≥",
    section: "author",
    isPresent: (e) => typeof e.replyCount === "number",
    clear: () => ({ replyCount: undefined }),
    seed: () => ({ replyCount: 1 }),
    Widget: makeNumberWidget("replyCount", "Replies threshold")
  },
  {
    type: "postScore",
    label: "Post score ≥",
    section: "author",
    isPresent: (e) => typeof e.postScore === "number",
    clear: () => ({ postScore: undefined }),
    seed: () => ({ postScore: 1 }),
    Widget: makeNumberWidget("postScore", "Post score threshold")
  },
  {
    type: "replyScore",
    label: "Reply score ≥",
    section: "author",
    isPresent: (e) => typeof e.replyScore === "number",
    clear: () => ({ replyScore: undefined }),
    seed: () => ({ replyScore: 1 }),
    Widget: makeNumberWidget("replyScore", "Reply score threshold")
  },
  {
    type: "firstCommentAge",
    label: "Account age ≥",
    section: "author",
    isPresent: (e) => typeof e.firstCommentTimestamp === "number",
    clear: () => ({ firstCommentTimestamp: undefined }),
    seed: () => ({ firstCommentTimestamp: 86400 }),
    Widget: DurationInput
  },
  {
    type: "role",
    label: "Role is",
    section: "request",
    isPresent: (e) => Array.isArray(e.role) && e.role.length > 0,
    clear: () => ({ role: undefined }),
    seed: () => ({ role: ["moderator"] }),
    Widget: RoleChips
  },
  {
    type: "publicationType",
    label: "On types",
    section: "request",
    isPresent: (e) => !!e.publicationType && Object.keys(e.publicationType).length > 0,
    clear: () => ({ publicationType: undefined }),
    seed: () => ({ publicationType: { post: true } }),
    Widget: PublicationTypeChecks
  },
  {
    type: "rateLimit",
    label: "Rate limit",
    section: "request",
    isPresent: (e) => typeof e.rateLimit === "number",
    clear: () => ({ rateLimit: undefined, rateLimitChallengeSuccess: undefined }),
    seed: () => ({ rateLimit: 10 }),
    Widget: RateLimitInput
  },
  {
    type: "address",
    label: "Author address is",
    section: "request",
    isPresent: (e) => Array.isArray(e.address) && e.address.length > 0,
    clear: () => ({ address: undefined }),
    seed: () => ({ address: [] }),
    Widget: AddressListInput
  },
  {
    type: "challenges",
    label: "Passed challenge",
    section: "advanced",
    isPresent: (e) => Array.isArray(e.challenges) && e.challenges.length > 0,
    clear: () => ({ challenges: undefined }),
    seed: () => ({ challenges: [] }),
    Widget: ChallengesRefInput
  },
  {
    type: "community",
    label: "Community reputation",
    section: "advanced",
    isPresent: (e) => !!e.community,
    clear: () => ({ community: undefined }),
    seed: () => ({ community: { addresses: [], maxCommentCids: 100 } }),
    Widget: CommunityReputationInput
  }
];

export function findConditionEntry(type: string) {
  return CONDITION_REGISTRY.find((e) => e.type === type);
}
