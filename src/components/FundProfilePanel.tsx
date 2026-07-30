import { useState } from "react";
import type { FundProfile } from "../types";

interface Props {
  profile: FundProfile;
  onChange: (profile: FundProfile) => void;
}

export function FundProfilePanel({ profile, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);

  function save(e: React.FormEvent) {
    e.preventDefault();
    onChange(draft);
    setEditing(false);
  }

  if (!editing) {
    return (
      <section className="panel fund-profile">
        <div className="fund-profile-header">
          <h2>Fund Criteria</h2>
          <button
            className="link-btn"
            onClick={() => {
              setDraft(profile);
              setEditing(true);
            }}
          >
            Edit
          </button>
        </div>
        <div className="fund-profile-grid">
          <div>
            <span className="muted">Focus</span>
            <div>{profile.sectorFocus}</div>
          </div>
          <div>
            <span className="muted">Stages</span>
            <div>{profile.stages}</div>
          </div>
          <div>
            <span className="muted">Check size</span>
            <div>
              ${profile.checkSizeMin}M–${profile.checkSizeMax}M ({profile.checkSizeFlexNote})
            </div>
          </div>
          <div>
            <span className="muted">Investment lens</span>
            <div className="investment-lens">{profile.investmentLens}</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="panel fund-profile">
      <h2>Fund Criteria</h2>
      <form className="theme-form" onSubmit={save}>
        <input
          placeholder="Sector focus"
          value={draft.sectorFocus}
          onChange={(e) => setDraft({ ...draft, sectorFocus: e.target.value })}
        />
        <input
          placeholder="Stages (e.g. Seed - Series A)"
          value={draft.stages}
          onChange={(e) => setDraft({ ...draft, stages: e.target.value })}
        />
        <div className="check-size-row">
          <input
            type="number"
            placeholder="Min $M"
            value={draft.checkSizeMin}
            onChange={(e) => setDraft({ ...draft, checkSizeMin: Number(e.target.value) })}
          />
          <input
            type="number"
            placeholder="Max $M"
            value={draft.checkSizeMax}
            onChange={(e) => setDraft({ ...draft, checkSizeMax: Number(e.target.value) })}
          />
        </div>
        <input
          placeholder="Flex note (e.g. can flex up to +5 / down to -2)"
          value={draft.checkSizeFlexNote}
          onChange={(e) => setDraft({ ...draft, checkSizeFlexNote: e.target.value })}
        />
        <textarea
          placeholder="Investment lens / screening question"
          value={draft.investmentLens}
          onChange={(e) => setDraft({ ...draft, investmentLens: e.target.value })}
          rows={3}
        />
        <div className="button-row">
          <button type="submit">Save</button>
          <button type="button" className="link-btn" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
