import type { Hit } from "../types";
import { HIT_STATUSES } from "../types";

export function StatsBar({ hits }: { hits: Hit[] }) {
  return (
    <div className="stats-bar">
      <div className="stat">
        <span className="stat-value">{hits.length}</span>
        <span className="stat-label">Total hits</span>
      </div>
      {HIT_STATUSES.map((s) => (
        <div className="stat" key={s}>
          <span className="stat-value">{hits.filter((h) => h.status === s).length}</span>
          <span className="stat-label">{s}</span>
        </div>
      ))}
    </div>
  );
}
