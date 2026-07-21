import { useState } from "react";
import { useStore } from "../state/store";

export function ProfileScreen(): JSX.Element {
  const profiles = useStore((s) => s.profiles);
  const createProfile = useStore((s) => s.createProfile);
  const deleteProfile = useStore((s) => s.deleteProfile);
  const selectProfile = useStore((s) => s.selectProfile);
  const [name, setName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <div className="stack" style={{ maxWidth: 560, margin: "0 auto" }}>
      <div>
        <p className="eyebrow">Ship's roster</p>
        <h2>Who is charting today?</h2>
      </div>

      {profiles.length > 0 && (
        <div className="stack">
          {profiles.map((p) => (
            <div key={p.id} className="card row" style={{ justifyContent: "space-between" }}>
              <div>
                <strong>{p.name}</strong>
                {p.isGuest && <span className="pill" style={{ marginLeft: 8 }}>guest</span>}
                <div className="faint">Joined {new Date(p.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="row">
                {confirmDelete === p.id ? (
                  <>
                    <button className="btn danger small" onClick={() => { void deleteProfile(p.id); setConfirmDelete(null); }}>
                      Delete forever
                    </button>
                    <button className="btn ghost small" onClick={() => setConfirmDelete(null)}>Keep</button>
                  </>
                ) : (
                  <>
                    <button className="btn primary" onClick={() => void selectProfile(p.id)}>Set sail</button>
                    <button className="btn ghost small" aria-label={`Delete profile ${p.name}`} onClick={() => setConfirmDelete(p.id)}>Delete</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card stack">
        <h3>New explorer</h3>
        <div className="field">
          <label htmlFor="profile-name">Name</label>
          <input
            id="profile-name"
            type="text"
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mo"
          />
        </div>
        <div className="row">
          <button className="btn primary" disabled={name.trim().length === 0} onClick={() => { void createProfile(name, false); setName(""); }}>
            Create profile
          </button>
          <button className="btn ghost" onClick={() => void createProfile("", true)}>
            Continue as guest
          </button>
        </div>
        <p className="faint">Guest progress is saved like any profile but can be deleted in one step later.</p>
      </div>
    </div>
  );
}
