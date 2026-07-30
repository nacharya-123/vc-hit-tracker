import { supabase } from "./supabaseClient";
import type { FundProfile, Hit, PortfolioCompany, SourceLink, Theme } from "./types";

// --- row <-> app-type mappers (DB is snake_case, app types are camelCase) ---

function rowToTheme(r: any): Theme {
  return { id: r.id, name: r.name, description: r.description, createdAt: r.created_at };
}
function themeToRow(t: Theme) {
  return { id: t.id, name: t.name, description: t.description };
}

function rowToPortfolio(r: any): PortfolioCompany {
  return { id: r.id, name: r.name, website: r.website };
}
function portfolioToRow(p: PortfolioCompany) {
  return { id: p.id, name: p.name, website: p.website };
}

function rowToSource(r: any): SourceLink {
  return { id: r.id, name: r.name, url: r.url, description: r.description };
}
function sourceToRow(s: SourceLink) {
  return { id: s.id, name: s.name, url: s.url, description: s.description };
}

function rowToHit(r: any): Hit {
  return {
    id: r.id,
    company: r.company,
    website: r.website,
    themeId: r.theme_id,
    source: r.source,
    notes: r.notes,
    status: r.status,
    oncologyRelevance: r.oncology_relevance,
    addedDate: r.added_date,
    affinityPushedDate: r.affinity_pushed_date ?? undefined,
  };
}
function hitToRow(h: Hit) {
  return {
    id: h.id,
    company: h.company,
    website: h.website,
    theme_id: h.themeId || null,
    source: h.source,
    notes: h.notes,
    status: h.status,
    oncology_relevance: h.oncologyRelevance,
    added_date: h.addedDate,
    affinity_pushed_date: h.affinityPushedDate ?? null,
  };
}

function rowToFundProfile(r: any): FundProfile {
  return {
    sectorFocus: r.sector_focus,
    stages: r.stages,
    checkSizeMin: r.check_size_min,
    checkSizeMax: r.check_size_max,
    checkSizeFlexNote: r.check_size_flex_note,
    investmentLens: r.investment_lens,
  };
}
function fundProfileToRow(f: FundProfile) {
  return {
    sector_focus: f.sectorFocus,
    stages: f.stages,
    check_size_min: f.checkSizeMin,
    check_size_max: f.checkSizeMax,
    check_size_flex_note: f.checkSizeFlexNote,
    investment_lens: f.investmentLens,
  };
}

// --- fetch-all ---

export async function fetchThemes(): Promise<Theme[]> {
  const { data, error } = await supabase.from("themes").select("*").order("created_at");
  if (error) throw error;
  return (data ?? []).map(rowToTheme);
}

export async function fetchPortfolio(): Promise<PortfolioCompany[]> {
  const { data, error } = await supabase.from("portfolio_companies").select("*").order("name");
  if (error) throw error;
  return (data ?? []).map(rowToPortfolio);
}

export async function fetchSources(): Promise<SourceLink[]> {
  const { data, error } = await supabase.from("source_links").select("*").order("name");
  if (error) throw error;
  return (data ?? []).map(rowToSource);
}

export async function fetchHits(): Promise<Hit[]> {
  const { data, error } = await supabase.from("hits").select("*").order("added_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToHit);
}

export async function fetchFundProfile(): Promise<FundProfile | null> {
  const { data, error } = await supabase.from("fund_profile").select("*").eq("id", 1).maybeSingle();
  if (error) throw error;
  return data ? rowToFundProfile(data) : null;
}

export async function updateFundProfile(profile: FundProfile) {
  const { error } = await supabase.from("fund_profile").update(fundProfileToRow(profile)).eq("id", 1);
  if (error) throw error;
}

// --- generic diff-sync: given a previous and next array of the same
// row-shaped type, insert what's new, delete what's gone, update what
// changed. Lets existing components keep a simple "whole array" interface
// while writes actually land as targeted Supabase calls. ---

async function syncArray<T extends { id: string }>(
  table: string,
  prev: T[],
  next: T[],
  toRow: (item: T) => Record<string, unknown>
) {
  const prevById = new Map(prev.map((p) => [p.id, p]));
  const nextIds = new Set(next.map((n) => n.id));

  const removedIds = prev.filter((p) => !nextIds.has(p.id)).map((p) => p.id);
  const added = next.filter((n) => !prevById.has(n.id));
  const updated = next.filter((n) => {
    const old = prevById.get(n.id);
    return old && JSON.stringify(old) !== JSON.stringify(n);
  });

  if (removedIds.length) {
    const { error } = await supabase.from(table).delete().in("id", removedIds);
    if (error) throw error;
  }
  if (added.length) {
    const { error } = await supabase.from(table).insert(added.map(toRow));
    if (error) throw error;
  }
  for (const item of updated) {
    const { error } = await supabase.from(table).update(toRow(item)).eq("id", item.id);
    if (error) throw error;
  }
}

export function syncThemes(prev: Theme[], next: Theme[]) {
  return syncArray("themes", prev, next, themeToRow);
}
export function syncPortfolio(prev: PortfolioCompany[], next: PortfolioCompany[]) {
  return syncArray("portfolio_companies", prev, next, portfolioToRow);
}
export function syncSources(prev: SourceLink[], next: SourceLink[]) {
  return syncArray("source_links", prev, next, sourceToRow);
}
export function syncHits(prev: Hit[], next: Hit[]) {
  return syncArray("hits", prev, next, hitToRow);
}

// --- realtime: refetch a table whenever any row changes, so every open
// tab across the team stays live without a manual refresh. ---

export function subscribeTable(table: string, onChange: () => void) {
  const channel = supabase
    .channel(`${table}-changes`)
    .on("postgres_changes", { event: "*", schema: "public", table }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
