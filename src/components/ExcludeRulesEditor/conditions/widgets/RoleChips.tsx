import type { WidgetProps } from "../types.ts";
import { ChipInput } from "../../../ui/ChipInput.tsx";

const ROLE_SUGGESTIONS = ["owner", "admin", "moderator"];

export function RoleChips({ exclude, onPatch }: WidgetProps) {
  return (
    <ChipInput
      value={exclude.roles ?? []}
      onChange={(next) => onPatch({ roles: next.length ? next : undefined })}
      suggestions={ROLE_SUGGESTIONS}
      placeholder="owner, admin, moderator…"
      ariaLabel="Roles"
    />
  );
}
