import type { WidgetProps } from "../types.ts";
import { ChipInput } from "../../../ui/ChipInput.tsx";

export function AddressListInput({ exclude, onPatch }: WidgetProps) {
  return (
    <ChipInput
      value={exclude.address ?? []}
      onChange={(next) => onPatch({ address: next.length ? next : undefined })}
      placeholder="plebbit address…"
      ariaLabel="Author addresses"
      monospace
    />
  );
}
