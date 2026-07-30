import { useState } from "react";
import type { Theme } from "../types";
import { newId } from "../id";

interface Props {
  themes: Theme[];
  onChange: (themes: Theme[]) => void;
}

export function ThemesPanel({ themes, onChange }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function addTheme(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const theme: Theme = {
      id: newId(),
      name: name.trim(),
      description: description.trim(),
      createdAt: new Date().toISOString(),
    };
    onChange([...themes, theme]);
    setName("");
    setDescription("");
  }

  function removeTheme(id: string) {
    onChange(themes.filter((t) => t.id !== id));
  }

  return (
    <section className="panel">
      <h2>Investment Themes</h2>
      <form className="theme-form" onSubmit={addTheme}>
        <input
          placeholder="Theme name (e.g. AI infra, Fintech APIs)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Short description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit">Add theme</button>
      </form>

      {themes.length === 0 ? (
        <p className="empty">No themes yet. Add one above.</p>
      ) : (
        <ul className="theme-list">
          {themes.map((t) => (
            <li key={t.id}>
              <div>
                <strong>{t.name}</strong>
                {t.description && <span className="muted"> — {t.description}</span>}
              </div>
              <button className="link-btn" onClick={() => removeTheme(t.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
