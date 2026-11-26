import type { WidgetProps } from "../types.ts";
import { ChipInput } from "../../../ui/ChipInput.tsx";

// pkc-js lists author identities in two fields: `publicKeys` for key-derived addresses and `names` for domains.
export function makeAuthorListWidget(field: "publicKeys" | "names", placeholder: string, ariaLabel: string) {
  return function AuthorListWidget({ exclude, onPatch }: WidgetProps) {
    return (
      <ChipInput
        value={exclude[field] ?? []}
        onChange={(next) => onPatch({ [field]: next.length ? next : undefined })}
        placeholder={placeholder}
        ariaLabel={ariaLabel}
        monospace
      />
    );
  };
}
