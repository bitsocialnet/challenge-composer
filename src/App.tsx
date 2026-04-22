import { useMemo, useState } from "react";
import styles from "./App.module.css";
import { Header } from "./components/Header/Header.tsx";
import { ChallengesEditor } from "./components/ChallengesEditor/ChallengesEditor.tsx";
import { JsonPreview } from "./components/JsonPreview/JsonPreview.tsx";
import { ImportDialog } from "./components/ImportDialog/ImportDialog.tsx";
import { ShareDialog } from "./components/ShareDialog/ShareDialog.tsx";
import { useSettings } from "./state/useSettingsStore.ts";
import { CommunityChallengeSettingSchema } from "./pkc-schema.ts";

const ChallengeSettingsArraySchema = CommunityChallengeSettingSchema.array();

export function App() {
  const { state } = useSettings();
  const [showImport, setShowImport] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const validation = useMemo(() => ChallengeSettingsArraySchema.safeParse(state), [state]);

  return (
    <div className={styles.root}>
      <Header onImport={() => setShowImport(true)} onShare={() => setShowShare(true)} />
      <main className={styles.main}>
        <section className={styles.previewPane}>
          <JsonPreview settings={state} validation={validation} />
        </section>
        <section className={styles.editorPane}>
          <ChallengesEditor />
        </section>
      </main>
      {showImport ? <ImportDialog onClose={() => setShowImport(false)} /> : null}
      {showShare ? <ShareDialog onClose={() => setShowShare(false)} /> : null}
    </div>
  );
}
