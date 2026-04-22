import fiveChan from "./5chan-community-defaults.jsonc?raw";
import captchaOnly from "./captcha-only.jsonc?raw";
import empty from "./empty.jsonc?raw";

export interface Preset {
  id: string;
  label: string;
  description: string;
  jsonc: string;
}

export const PRESETS: Preset[] = [
  {
    id: "5chan",
    label: "5chan board defaults",
    description: "Brute-force gate, comment-edit lock, post & reply captchas with pending approval.",
    jsonc: fiveChan
  },
  {
    id: "captcha-only",
    label: "Captcha only",
    description: "A single captcha, mods bypass. Good starter template.",
    jsonc: captchaOnly
  },
  {
    id: "empty",
    label: "Empty (no challenges)",
    description: "Open posting — nobody solves anything.",
    jsonc: empty
  }
];

export function findPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
