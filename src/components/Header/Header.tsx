import { useRef } from "react";
import styles from "./Header.module.css";
import { PRESETS, findPreset } from "../../presets/index.ts";
import { parseJsonc, stringifyJson } from "../../lib/jsonc.ts";
import { useSettings } from "../../state/useSettingsStore.ts";
import { CommunityChallengeSettingSchema } from "../../pkc-schema.ts";

const ChallengeSettingsArraySchema = CommunityChallengeSettingSchema.array();

interface HeaderProps {
  onImport: () => void;
  onShare: () => void;
}

export function Header({ onImport, onShare }: HeaderProps) {
  const { state, dispatch } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePreset = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const id = event.target.value;
    event.target.value = "";
    if (!id) return;
    const preset = findPreset(id);
    if (!preset) return;
    const { value, errors } = parseJsonc(preset.jsonc);
    if (errors.length) {
      alert(`Preset parse error: ${errors.join(", ")}`);
      return;
    }
    const parsed = ChallengeSettingsArraySchema.safeParse(value);
    if (!parsed.success) {
      alert(`Preset validation failed: ${parsed.error.message}`);
      return;
    }
    dispatch({ type: "REPLACE_ALL", settings: parsed.data });
  };

  const handleDownload = () => {
    const blob = new Blob([stringifyJson(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "challenges.jsonc";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const text = await file.text();
    const { value, errors } = parseJsonc(text);
    if (errors.length) {
      alert(`Could not parse file: ${errors.join(", ")}`);
      return;
    }
    const parsed = ChallengeSettingsArraySchema.safeParse(value);
    if (!parsed.success) {
      alert(`Invalid challenge settings: ${parsed.error.message}`);
      return;
    }
    dispatch({ type: "REPLACE_ALL", settings: parsed.data });
  };

  return (
    <header className={styles.header}>
      <div className={styles.title}>
        <strong>challenge-composer</strong>
        <span className={styles.subtitle}>edit pkc-js challenge settings</span>
      </div>
      <div className={styles.actions}>
        <select className={styles.presetSelect} onChange={handlePreset} defaultValue="" aria-label="Load preset">
          <option value="" disabled>
            Load preset…
          </option>
          {PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={onImport}>
          Paste JSONC
        </button>
        <button type="button" onClick={handleUploadClick}>
          Upload file
        </button>
        <input ref={fileInputRef} type="file" accept=".json,.jsonc,application/json" onChange={handleUpload} hidden />
        <button type="button" onClick={handleDownload}>
          Download
        </button>
        <button type="button" onClick={onShare}>
          Share URL
        </button>
      </div>
    </header>
  );
}
