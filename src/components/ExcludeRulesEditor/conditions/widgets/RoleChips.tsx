import type { WidgetProps } from "../types.ts";
import { ChipInput } from "../../../ui/ChipInput.tsx";

const ROLE_SUGGESTIONS = ["owner", "admin", "moderator"];

export function RoleChips({ exclude, onPatch }: WidgetProps) {
  return (
    <ChipInput
      value={exclude.role ?? []}
      onChange={(next) => onPatch({ role: next.length ? next : undefined })}
      suggestions={ROLE_SUGGESTIONS}
      placeholder="owner, admin, moderator…"
      ariaLabel="Roles"
    />
  );
}
