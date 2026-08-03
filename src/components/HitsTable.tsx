import { useMemo, useState } from "react";
import type { Hit, HitStatus, OncologyRelevance, Theme } from "../types";
import { HIT_STATUSES, ONCOLOGY_RELEVANCE_OPTIONS } from "../types";

interface Props {
  hits: Hit[];
  themes: Theme[];
  onChange: (hits: Hit[]) => void;
}

function fitClass(relevance: OncologyRelevance) {
  return `fit fit-${relevance.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
}

const NOTES_PREVIEW_LENGTH = 90;

function NotesCell({ notes }: { notes: string }) {
  const [expanded, setExpanded] = useState(false);

  if (!notes) return <>—</>;
  if (notes.length <= NOTES_PREVIEW_LENGTH) return <>{notes}</>;

  if (expanded) {
    return (
      <>
        {notes}{" "}
        <button className="link-btn notes-toggle" onClick={() => setExpanded(false)}>
          Show less
        </button>
      </>
    );
  }

  return (
    <>
      {notes.slice(0, NOTES_PREVIEW_LENGTH).trimEnd()}…{" "}
      <button className="link-btn notes-toggle" onClick={() => setExpanded(true)}>
        Show more
      </button>
    </>
  );
}

export function HitsTable({ hits, themes, onChange }: Props) {
  const [themeFilter, setThemeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [fitFilter, setFitFilter] = useState<string>("all");

  const themeName = (id: string) => themes.find((t) => t.id === id)?.name ?? "—";

  const filtered = useMemo(() => {
    return hits
      .filter((h) => themeFilter === "all" || h.themeId === themeFilter)
      .filter((h) => statusFilter === "all" || h.status === statusFilter)
      .filter((h) => fitFilter === "all" || h.oncologyRelevance === fitFilter)
      .sort((a, b) => (a.addedDate < b.addedDate ? 1 : -1));
  }, [hits, themeFilter, statusFilter, fitFilter]);

  function updateStatus(id: string, status: HitStatus) {
    onChange(
      hits.map((h) =>
        h.id === id
          ? {
              ...h,
              status,
              affinityPushedDate:
                status === "Pushed to Affinity"
                  ? new Date().toISOString()
                  : h.affinityPushedDate,
            }
          : h
      )
    );
  }

  function updateFit(id: string, oncologyRelevance: OncologyRelevance) {
    onChange(hits.map((h) => (h.id === id ? { ...h, oncologyRelevance } : h)));
  }

  function removeHit(id: string) {
    onChange(hits.filter((h) => h.id !== id));
  }

  return (
    <section className="panel">
      <div className="table-header">
        <h2>Hits</h2>
        <div className="filters">
          <select value={themeFilter} onChange={(e) => setThemeFilter(e.target.value)}>
            <option value="all">All themes</option>
            {themes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <select value={fitFilter} onChange={(e) => setFitFilter(e.target.value)}>
            <option value="all">All fit levels</option>
            {ONCOLOGY_RELEVANCE_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            {HIT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="empty">No hits match these filters yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Theme</th>
                <th>Oncology Fit</th>
                <th>Source</th>
                <th>Notes</th>
                <th>Added</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((h) => (
                <tr key={h.id}>
                  <td>
                    {h.website ? (
                      <a href={h.website} target="_blank" rel="noreferrer">
                        {h.company}
                      </a>
                    ) : (
                      h.company
                    )}
                  </td>
                  <td>{themeName(h.themeId)}</td>
                  <td>
                    <select
                      className={fitClass(h.oncologyRelevance)}
                      value={h.oncologyRelevance}
                      onChange={(e) => updateFit(h.id, e.target.value as OncologyRelevance)}
                    >
                      {ONCOLOGY_RELEVANCE_OPTIONS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {h.source.startsWith("http") ? (
                      <a href={h.source} target="_blank" rel="noreferrer">
                        Source
                      </a>
                    ) : (
                      h.source || "—"
                    )}
                  </td>
                  <td className="notes-cell">
                    <NotesCell notes={h.notes} />
                  </td>
                  <td>{new Date(h.addedDate).toLocaleDateString()}</td>
                  <td>
                    <select
                      className={`status status-${h.status.replace(/\s+/g, "-").toLowerCase()}`}
                      value={h.status}
                      onChange={(e) => updateStatus(h.id, e.target.value as HitStatus)}
                    >
                      {HIT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button className="link-btn" onClick={() => removeHit(h.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
