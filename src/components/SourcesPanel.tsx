import { useState } from "react";
import type { SourceLink } from "../types";
import { newId } from "../id";

interface Props {
  sources: SourceLink[];
  onChange: (sources: SourceLink[]) => void;
}

export function SourcesPanel({ sources, onChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");

  function addSource(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    onChange([...sources, { id: newId(), name: name.trim(), url: url.trim(), description: description.trim() }]);
    setName("");
    setUrl("");
    setDescription("");
  }

  function removeSource(id: string) {
    onChange(sources.filter((s) => s.id !== id));
  }

  return (
    <section className="panel">
      <div className="fund-profile-header">
        <h2>Sources to Check ({sources.length})</h2>
        <button className="link-btn" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Collapse" : "Manage"}
        </button>
      </div>
      <p className="empty">
        Newsletters/trackers worth scanning during a sourcing pass.
      </p>
      <ul className="theme-list">
        {sources.map((s) => (
          <li key={s.id}>
            <div>
              <a href={s.url} target="_blank" rel="noreferrer">
                <strong>{s.name}</strong>
              </a>
              {expanded && s.description && <span className="muted"> — {s.description}</span>}
            </div>
            {expanded && (
              <button className="link-btn" onClick={() => removeSource(s.id)}>
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
      {expanded && (
        <form className="theme-form" onSubmit={addSource}>
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <input
            placeholder="Why it's useful (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button type="submit">Add source</button>
        </form>
      )}
    </section>
  );
}
