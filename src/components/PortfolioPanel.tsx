import { useState } from "react";
import type { PortfolioCompany } from "../types";
import { newId } from "../id";

interface Props {
  portfolio: PortfolioCompany[];
  onChange: (portfolio: PortfolioCompany[]) => void;
}

export function PortfolioPanel({ portfolio, onChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");

  function addCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onChange([...portfolio, { id: newId(), name: name.trim(), website: website.trim() }]);
    setName("");
    setWebsite("");
  }

  function removeCompany(id: string) {
    onChange(portfolio.filter((p) => p.id !== id));
  }

  return (
    <section className="panel">
      <div className="fund-profile-header">
        <h2>Portfolio ({portfolio.length})</h2>
        <button className="link-btn" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Collapse" : "Manage"}
        </button>
      </div>
      <p className="empty">
        Existing portfolio companies — used to flag when a sourced hit is
        actually already a portco.
      </p>
      {expanded && (
        <>
          <form className="theme-form" onSubmit={addCompany}>
            <input
              placeholder="Company name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              placeholder="Website (optional)"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
            <button type="submit">Add portfolio company</button>
          </form>
          <ul className="theme-list">
            {portfolio.map((p) => (
              <li key={p.id}>
                <div>
                  <strong>{p.name}</strong>
                  {p.website && <span className="muted"> — {p.website}</span>}
                </div>
                <button className="link-btn" onClick={() => removeCompany(p.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
