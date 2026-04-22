import type { CommunityChallengeSetting } from "@pkcprotocol/pkc-js/challenges";

export type { CommunityChallengeSetting };

export type ChallengeExclude = NonNullable<CommunityChallengeSetting["exclude"]>[number];

export type PublicationTypeExclude = NonNullable<ChallengeExclude["publicationType"]>;

export type CommunityExclude = NonNullable<ChallengeExclude["community"]>;

export type ChallengeSettings = CommunityChallengeSetting[];
