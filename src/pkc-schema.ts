// pkc-js's community-schema subpath isn't in its public `exports` map (per the current
// version), so we reach the compiled schema directly. Importing
// `publications/comment/schema.js` first ensures `RepliesPagesIpfsSchema` is fully
// initialized by the time `CommunityChallengeSettingSchema` loads — without this
// side-effect preload, zod 4's `.strict()` eagerly evaluates a circular getter
// during pkc-js's own init and throws TDZ.
import "@pkc/comment-schema";
export { CommunityChallengeSettingSchema } from "@pkc/community-schema";
