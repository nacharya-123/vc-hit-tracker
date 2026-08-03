import { useEffect, useState } from "react";

type Signal = "Company lead" | "Market signal" | "Policy signal" | "Podcast note";

interface PulseItem {
  source: string;
  sourceUrl: string;
  itemUrl: string;
  format: string;
  signal: Signal;
  title: string;
  summary: string;
  whyItMatters: string;
  nextMove: string;
  tags: string[];
  published: string;
  matchedCompany?: string;
}

interface SourceState {
  source: string;
  status: "Live" | "Unavailable" | "Needs connector";
  itemCount: number;
  feedUrl?: string;
  error?: string;
}

interface DigestResponse {
  generatedAt: string;
  items: PulseItem[];
  sourceStates: SourceState[];
}

function signalClass(signal: Signal) {
  return `signal signal-${signal.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
}

export function DigestPanel() {
  const [data, setData] = useState<DigestResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    setError("");
    fetch("/api/digest")
      .then((r) => {
        if (!r.ok) throw new Error(`Digest request failed (${r.status})`);
        return r.json();
      })
      .then((d: DigestResponse) => setData(d))
      .catch((err) => setError(err.message ?? String(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <div className="digest">
      <div className="digest-header">
        <div>
          <h2>Yosemite Digest</h2>
          <p className="subtitle">
            Market, policy, and research signals pulled from your source list, plus a flag
            whenever a story mentions a portfolio company by name.
          </p>
        </div>
        <button className="link-btn" onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && <p className="warning">Digest error: {error}</p>}

      {data && (
        <div className="digest-sources">
          {data.sourceStates.map((s) => (
            <span key={s.source} className={`source-chip source-chip-${s.status.replace(/\s+/g, "-").toLowerCase()}`}>
              {s.source}
              {s.status === "Live" ? ` · ${s.itemCount}` : ""}
            </span>
          ))}
        </div>
      )}

      {loading && !data ? (
        <p className="empty">Loading digest…</p>
      ) : data && data.items.length === 0 ? (
        <p className="empty">No items came back from any source right now — try refreshing shortly.</p>
      ) : (
        <div className="digest-list">
          {data?.items.map((item, i) => (
            <article key={`${item.itemUrl}-${i}`} className="digest-item panel">
              <div className="digest-item-top">
                <span className={signalClass(item.signal)}>{item.signal}</span>
                <span className="muted">
                  {item.source} · {item.format}
                  {item.published ? ` · ${item.published}` : ""}
                </span>
              </div>
              <h3>
                <a href={item.itemUrl} target="_blank" rel="noreferrer">
                  {item.title}
                </a>
              </h3>
              <p>{item.summary}</p>
              <p className="digest-why">
                <strong>Why it matters:</strong> {item.whyItMatters}
              </p>
              <p className="digest-why">
                <strong>Next move:</strong> {item.nextMove}
              </p>
              <div className="digest-tags">
                {item.tags.map((tag) => (
                  <span key={tag} className="tag-pill">
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
