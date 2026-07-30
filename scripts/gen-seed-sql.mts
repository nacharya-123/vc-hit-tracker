import { DEFAULT_THEMES } from "../src/defaultThemes.ts";
import { DEFAULT_PORTFOLIO } from "../src/defaultPortfolio.ts";
import { DEFAULT_SOURCES } from "../src/defaultSources.ts";
import { SEED_HITS } from "../src/seedHits.ts";
import { DEFAULT_FUND_PROFILE } from "../src/types.ts";

function esc(s: string): string {
  return "'" + s.replace(/'/g, "''") + "'";
}

const lines: string[] = [];

lines.push("-- Fund profile (singleton row)");
lines.push(`insert into fund_profile (id, sector_focus, stages, check_size_min, check_size_max, check_size_flex_note, investment_lens) values (1, ${esc(DEFAULT_FUND_PROFILE.sectorFocus)}, ${esc(DEFAULT_FUND_PROFILE.stages)}, ${DEFAULT_FUND_PROFILE.checkSizeMin}, ${DEFAULT_FUND_PROFILE.checkSizeMax}, ${esc(DEFAULT_FUND_PROFILE.checkSizeFlexNote)}, ${esc(DEFAULT_FUND_PROFILE.investmentLens)});`);
lines.push("");

lines.push("-- Themes");
for (const t of DEFAULT_THEMES) {
  lines.push(`insert into themes (name, description) values (${esc(t.name)}, ${esc(t.description)});`);
}
lines.push("");

lines.push("-- Portfolio companies");
for (const p of DEFAULT_PORTFOLIO) {
  lines.push(`insert into portfolio_companies (name, website) values (${esc(p.name)}, ${esc(p.website)});`);
}
lines.push("");

lines.push("-- Source links");
for (const s of DEFAULT_SOURCES) {
  lines.push(`insert into source_links (name, url, description) values (${esc(s.name)}, ${esc(s.url)}, ${esc(s.description)});`);
}
lines.push("");

lines.push("-- Seed hits (theme_id resolved by theme name lookup)");
for (const h of SEED_HITS) {
  lines.push(
    `insert into hits (company, website, theme_id, source, notes, status, oncology_relevance) values (${esc(h.company)}, ${esc(h.website)}, (select id from themes where name = ${esc(h.themeName)}), ${esc(h.source)}, ${esc(h.notes)}, 'New', ${esc(h.oncologyRelevance)});`
  );
}

console.log(lines.join("\n"));
