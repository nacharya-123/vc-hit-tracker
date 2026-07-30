import { useEffect, useRef, useState } from "react";
import type { Hit, OncologyRelevance, PortfolioCompany, Theme } from "../types";
import { ONCOLOGY_RELEVANCE_OPTIONS } from "../types";
import { newId } from "../id";

interface Props {
  themes: Theme[];
  portfolio: PortfolioCompany[];
  onAdd: (hit: Hit) => void;
}

export function HitForm({ themes, portfolio, onAdd }: Props) {
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [themeId, setThemeId] = useState(themes[0]?.id ?? "");
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [quickPaste, setQuickPaste] = useState("");
  const companyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!themes.some((t) => t.id === themeId)) {
      setThemeId(themes[0]?.id ?? "");
    }
  }, [themes, themeId]);
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [oncologyRelevance, setOncologyRelevance] = useState<OncologyRelevance>(
    "Needs Assessment"
  );

  const portfolioMatch = portfolio.find(
    (p) => p.name.trim().toLowerCase() === company.trim().toLowerCase()
  );

  function handleQuickPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const text = e.clipboardData.getData("text");
    if (!text.trim()) return;
    const urls = text.match(/https?:\/\/[^\s)]+/g) ?? [];
    const nonLinkedInUrl = urls.find((u) => !u.includes("linkedin.com"));
    if (nonLinkedInUrl && !website) setWebsite(nonLinkedInUrl);
    setNotes((prev) => (prev ? `${prev}\n\n${text}` : text));
    setSource((prev) => prev || "LinkedIn (manual)");
    setQuickPaste(text);
    companyInputRef.current?.focus();
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim()) return;
    onAdd({
      id: newId(),
      company: company.trim(),
      website: website.trim(),
      themeId,
      source: source.trim(),
      notes: notes.trim(),
      status: "New",
      oncologyRelevance,
      addedDate: new Date().toISOString(),
    });
    setCompany("");
    setWebsite("");
    setSource("");
    setNotes("");
    setOncologyRelevance("Needs Assessment");
    setQuickPaste("");
    setShowQuickCapture(false);
  }

  return (
    <section className="panel">
      <div className="fund-profile-header">
        <h2>Log a Hit</h2>
        <button
          type="button"
          className="link-btn"
          onClick={() => setShowQuickCapture(!showQuickCapture)}
        >
          {showQuickCapture ? "Hide paste box" : "Paste from LinkedIn"}
        </button>
      </div>
      {showQuickCapture && (
        <div className="quick-capture">
          <p className="field-label">
            Paste a post, comment, or profile blurb — we'll drop it into Notes,
            tag the source, and grab any non-LinkedIn link as the website.
            Then just fill in the company name and theme below.
          </p>
          <textarea
            placeholder="Paste here..."
            value={quickPaste}
            onChange={(e) => setQuickPaste(e.target.value)}
            onPaste={handleQuickPaste}
            rows={3}
          />
        </div>
      )}
      {themes.length === 0 ? (
        <p className="empty">Add a theme first so you can tag hits against it.</p>
      ) : (
        <form className="hit-form" onSubmit={submit}>
          <input
            ref={companyInputRef}
            placeholder="Company name"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
          />
          {portfolioMatch && (
            <p className="warning">
              Already in portfolio{portfolioMatch.website ? ` (${portfolioMatch.website})` : ""} — check before adding as a new hit.
            </p>
          )}
          <input
            placeholder="Website (optional)"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
          <select value={themeId} onChange={(e) => setThemeId(e.target.value)}>
            {themes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <input
            placeholder="Source (e.g. referral, TechCrunch, web search)"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
          <textarea
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
          <label className="field-label">
            Cancer patient care delivery, or drug/therapy time-to-market impact?
          </label>
          <select
            value={oncologyRelevance}
            onChange={(e) => setOncologyRelevance(e.target.value as OncologyRelevance)}
          >
            {ONCOLOGY_RELEVANCE_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <button type="submit">Add hit</button>
        </form>
      )}
    </section>
  );
}
