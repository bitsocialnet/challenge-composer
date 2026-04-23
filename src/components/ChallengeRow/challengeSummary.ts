import type { ChallengeExclude, CommunityChallengeSetting } from "../../types/challenges.ts";

export function summarize(challenge: CommunityChallengeSetting): string {
  const parts: string[] = [];

  const excludes = challenge.exclude ?? [];
  if (excludes.length > 0) {
    const first = summarizeGroup(excludes[0]!);
    if (excludes.length === 1) {
      if (first) parts.push(`Bypass: ${first}`);
      else parts.push("Bypass: everyone (empty group)");
    } else {
      parts.push(`Bypass: ${first || "empty"} · +${excludes.length - 1} more`);
    }
  }

  if (challenge.pendingApproval) parts.push("pending approval");

  return parts.join(" · ");
}

function summarizeGroup(g: ChallengeExclude): string {
  const bits: string[] = [];
  if (g.role && g.role.length > 0) bits.push(g.role.join("/"));
  if (typeof g.postCount === "number") bits.push(`${g.postCount}+ posts`);
  if (typeof g.replyCount === "number") bits.push(`${g.replyCount}+ replies`);
  if (typeof g.postScore === "number") bits.push(`post ≥${g.postScore}`);
  if (typeof g.replyScore === "number") bits.push(`reply ≥${g.replyScore}`);
  if (typeof g.firstCommentTimestamp === "number") {
    const s = g.firstCommentTimestamp;
    if (s >= 86400 && s % 86400 === 0) bits.push(`age ≥${s / 86400}d`);
    else if (s >= 3600 && s % 3600 === 0) bits.push(`age ≥${s / 3600}h`);
    else if (s >= 60 && s % 60 === 0) bits.push(`age ≥${s / 60}m`);
    else bits.push(`age ≥${s}s`);
  }
  if (typeof g.rateLimit === "number") bits.push(`rate ${g.rateLimit}/h`);
  if (g.address && g.address.length > 0) {
    bits.push(`${g.address.length} author${g.address.length === 1 ? "" : "s"}`);
  }
  if (g.challenges && g.challenges.length > 0) {
    bits.push(`passed #${g.challenges.map((i) => i + 1).join(",")}`);
  }
  if (g.publicationType && Object.keys(g.publicationType).length > 0) {
    const types = Object.entries(g.publicationType)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (types.length > 0) bits.push(`on ${types.join("/")}`);
  }
  if (g.community) bits.push("community rep");
  return bits.join(" AND ");
}
