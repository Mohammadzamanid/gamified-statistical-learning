import { useState } from "react";
import { useStore } from "../state/store";

export function SettingsScreen(): JSX.Element {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const resetProgress = useStore((s) => s.resetProgress);
  const save = useStore((s) => s.save);
  const client = useStore((s) => s.client);
  const [confirmReset, setConfirmReset] = useState(false);
  const [exported, setExported] = useState<string | null>(null);
  const [importText, setImportText] = useState("");
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const importSaveToStore = useStore((s) => s.selectProfile);

  return (
    <div className="stack" style={{ maxWidth: 640, margin: "0 auto" }}>
      <div>
        <p className="eyebrow">Settings</p>
        <h2>Instruments and comfort</h2>
      </div>

      <div className="card stack">
        <h3>Appearance</h3>
        <div className="field">
          <label htmlFor="set-theme">Theme</label>
          <select id="set-theme" value={settings.theme} onChange={(e) => void updateSettings({ theme: e.target.value as typeof settings.theme })}>
            <option value="dark">Chartroom (dark)</option>
            <option value="light">Paper chart (light)</option>
            <option value="high-contrast">High contrast</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="set-scale">Text size</label>
          <select id="set-scale" value={settings.textScale} onChange={(e) => void updateSettings({ textScale: e.target.value as typeof settings.textScale })}>
            <option value="s">Small</option>
            <option value="m">Medium</option>
            <option value="l">Large</option>
            <option value="xl">Extra large</option>
          </select>
        </div>
        <label className="row" style={{ cursor: "pointer" }}>
          <input type="checkbox" checked={settings.reducedMotion} onChange={(e) => void updateSettings({ reducedMotion: e.target.checked })} />
          Reduce motion (also follows your system preference)
        </label>
        <label className="row" style={{ cursor: "pointer" }}>
          <input type="checkbox" checked={settings.colorBlindSafe} onChange={(e) => void updateSettings({ colorBlindSafe: e.target.checked })} />
          Color-blind-safe status colors (blue/orange instead of green/red)
        </label>
      </div>

      {save && (
        <div className="card stack">
          <h3>Save data</h3>
          <div className="row">
            <button
              className="btn"
              onClick={async () => {
                const r = await client.exportSave(save.profile.id);
                setExported(r.ok ? r.value : `Export failed: ${r.error}`);
              }}
            >
              Export save as text
            </button>
            {confirmReset ? (
              <>
                <button className="btn danger" onClick={() => { void resetProgress(); setConfirmReset(false); }}>Erase all progress</button>
                <button className="btn ghost" onClick={() => setConfirmReset(false)}>Keep my progress</button>
              </>
            ) : (
              <button className="btn danger" onClick={() => setConfirmReset(true)}>Reset progress…</button>
            )}
          </div>
          {exported && (
            <div className="field">
              <label>Copy this text to back up or move your save</label>
              <textarea className="data" readOnly value={exported} rows={6} />
            </div>
          )}
          <div className="field">
            <label htmlFor="import-save">Import a save (paste exported text)</label>
            <textarea id="import-save" className="data" value={importText} onChange={(e) => setImportText(e.target.value)} rows={4} />
          </div>
          <div className="row">
            <button
              className="btn"
              disabled={importText.trim().length === 0}
              onClick={async () => {
                const r = await client.importSave(importText);
                if (r.ok) {
                  setImportMsg("Save imported.");
                  setImportText("");
                  await importSaveToStore(r.value.profile.id);
                } else {
                  setImportMsg(`Import failed: ${r.error}`);
                }
              }}
            >
              Import save
            </button>
            {importMsg && <span className="muted">{importMsg}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
