import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

// Scans SEC EDGAR for Form D filings (the notice a company files when it
// closes a private funding round) from the last couple of days, keeps the
// ones reporting a raise of at least MIN_RAISE_USD, and runs each through
// Claude with the fund's investment lens to decide if it's a plausible fit
// (direct or multi-hop chain to cancer patients) — matching companies get
// inserted into the shared `hits` table as status "New" for human review,
// same as the nightly theme-sourcing agent.
//
// No industry pre-filter by design (per direction: filter on raise size,
// let the investment-lens assessment do the real filtering) — MAX_CANDIDATES
// exists purely as a cost/time safety valve on unusually heavy filing days.
//
// Requires the same env vars as api/source-hits.ts: SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, CRON_SECRET.

const MIN_RAISE_USD = 500_000;
const MAX_CANDIDATES = 25;
const BATCH_SIZE = 5;
const LOOKBACK_DAYS = 2; // covers weekends/SEC processing lag between daily runs

// SEC asks automated callers to identify themselves with a real contact.
const SEC_USER_AGENT = "VC-Hit-Tracker/1.0 (nishaa@stanford.edu)";

interface FormDFiling {
  cik: string;
  companyName: string;
  fileDate: string;
  accessionNo: string;
  docPath: string;
}

function isoDateDaysAgo(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

async function searchFormDFilings(startDate: string, endDate: string): Promise<FormDFiling[]> {
  const filings: FormDFiling[] = [];
  let from = 0;

  // Safety cap: at most 3 pages (~300 filings) per run.
  for (let page = 0; page < 3; page++) {
    const url = `https://efts.sec.gov/LATEST/search-index?q=&forms=D&startdt=${startDate}&enddt=${endDate}&from=${from}`;
    const res = await fetch(url, { headers: { "User-Agent": SEC_USER_AGENT } });
    if (!res.ok) break;
    const json: any = await res.json();
    const hits: any[] = json?.hits?.hits ?? [];
    if (hits.length === 0) break;

    for (const hit of hits) {
      const id: string = hit._id ?? "";
      const [accessionRaw, ...pathParts] = id.split(":");
      const accessionNo = accessionRaw?.replace(/-/g, "") ?? "";
      const docPath = pathParts.join(":") || "primary_doc.xml";
      const cik = String(hit._source?.cik ?? "").replace(/^0+/, "");
      const displayName: string = (hit._source?.display_names ?? [])[0] ?? "Unknown";
      const companyName = displayName.replace(/\s*\(CIK\s*\d+\)\s*$/i, "").trim();
      if (!cik || !accessionNo) continue;
      filings.push({ cik, companyName, fileDate: hit._source?.file_date ?? "", accessionNo, docPath });
    }

    if (hits.length < 100) break;
    from += 100;
  }

  return filings;
}

function xmlTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i"));
  return match ? match[1].trim() : "";
}

async function fetchFilingDetails(filing: FormDFiling) {
  const url = `https://www.sec.gov/Archives/edgar/data/${filing.cik}/${filing.accessionNo}/${filing.docPath}`;
  const res = await fetch(url, { headers: { "User-Agent": SEC_USER_AGENT } });
  if (!res.ok) return null;
  const xml = await res.text();

  const industryGroupType = xmlTag(xml, "industryGroupType");
  const totalAmountSoldRaw = xmlTag(xml, "totalAmountSold") || xmlTag(xml, "totalOfferingAmount");
  const totalAmountSold = Number(totalAmountSoldRaw.replace(/[^0-9.]/g, ""));
  const state = xmlTag(xml, "stateOrCountry");

  return {
    industryGroupType,
    totalAmountSold: Number.isFinite(totalAmountSold) ? totalAmountSold : null,
    state,
    filingUrl: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${filing.cik}&type=D`,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const [fundProfileRes, portfolioRes, existingHitsRes] = await Promise.all([
    supabase.from("fund_profile").select("*").eq("id", 1).maybeSingle(),
    supabase.from("portfolio_companies").select("name"),
    supabase.from("hits").select("company"),
  ]);
  const { data: fundProfile } = fundProfileRes;
  if (!fundProfile) {
    return res.status(500).json({
      error: "No fund profile found",
      fundProfileError: fundProfileRes.error?.message ?? null,
    });
  }

  const knownNames = new Set([
    ...(portfolioRes.data ?? []).map((p) => p.name.toLowerCase()),
    ...(existingHitsRes.data ?? []).map((h) => h.company.toLowerCase()),
  ]);

  const startDate = isoDateDaysAgo(LOOKBACK_DAYS);
  const endDate = isoDateDaysAgo(0);
  const filings = await searchFormDFilings(startDate, endDate);

  // Fetch each filing's XML for the raise amount, and apply the $ floor —
  // this step is free (no LLM), so we do it for every filing before
  // spending Claude calls only on the ones that clear the bar.
  const detailed = await Promise.all(
    filings.map(async (f) => {
      const details = await fetchFilingDetails(f).catch(() => null);
      return details ? { ...f, ...details } : null;
    })
  );

  const qualifying = detailed
    .filter((f): f is NonNullable<typeof f> => f !== null)
    .filter((f) => f.totalAmountSold !== null && f.totalAmountSold >= MIN_RAISE_USD)
    .filter((f) => !knownNames.has(f.companyName.toLowerCase()))
    .slice(0, MAX_CANDIDATES);

  async function assessCandidate(f: (typeof qualifying)[number]) {
    const prompt = `A company just filed an SEC Form D, meaning it closed a private funding round.

Company: ${f.companyName}
State: ${f.state || "unknown"}
Amount raised (per SEC filing): $${f.totalAmountSold?.toLocaleString()}
SEC-reported industry group: ${f.industryGroupType || "unknown"}

Fund investment lens: ${fundProfile.investment_lens}
Sector focus: ${fundProfile.sector_focus}
Stages: ${fundProfile.stages}
Check size: $${fundProfile.check_size_min}M-$${fundProfile.check_size_max}M (${fundProfile.check_size_flex_note})

Use web search to find out what this company actually does. Then decide: is there a real, honest chain of effect (direct or multi-hop) from this company to cancer patients or the broader complex cancer care delivery landscape, consistent with the investment lens above? Be skeptical — an SEC industry tag alone is not evidence.

If it is NOT a plausible fit, respond with exactly: NOT_A_FIT

If it IS a plausible fit, respond with ONLY a JSON object in this exact shape, using real information from your search results:
{
  "website": "string (their real site, or empty string if unknown)",
  "oncologyRelevance": "Direct Cancer Care Delivery" | "Drug/Therapy Acceleration" | "Both" | "Indirect / General Healthtech" | "Needs Assessment",
  "chain": "string explaining the chain of effect to a cancer patient"
}`;

    const response = await anthropic.messages.create({
      model: "claude-opus-5",
      max_tokens: 2048,
      output_config: { effort: "medium" },
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 4 }],
      messages: [{ role: "user", content: prompt }],
    });

    const lastText = [...response.content].reverse().find((b) => b.type === "text");
    if (!lastText || lastText.type !== "text") return { filing: f, fit: null };
    if (lastText.text.includes("NOT_A_FIT")) return { filing: f, fit: null };

    const match = lastText.text.match(/\{[\s\S]*\}/);
    if (!match) return { filing: f, fit: null };
    try {
      return { filing: f, fit: JSON.parse(match[0]) };
    } catch {
      return { filing: f, fit: null };
    }
  }

  const added: string[] = [];
  const skipped: string[] = [];

  for (let i = 0; i < qualifying.length; i += BATCH_SIZE) {
    const batch = qualifying.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map((f) => assessCandidate(f)));
    for (const { filing, fit } of results) {
      if (!fit) {
        skipped.push(filing.companyName);
        continue;
      }
      const { error } = await supabase.from("hits").insert({
        company: filing.companyName,
        website: fit.website ?? "",
        theme_id: null,
        source: filing.filingUrl,
        notes: `Raised $${filing.totalAmountSold?.toLocaleString()} via Form D filed ${filing.fileDate}. Chain: ${fit.chain ?? ""}`,
        status: "New",
        oncology_relevance: fit.oncologyRelevance ?? "Needs Assessment",
      });
      if (error) {
        skipped.push(`${filing.companyName} (${error.message})`);
      } else {
        knownNames.add(filing.companyName.toLowerCase());
        added.push(filing.companyName);
      }
    }
  }

  return res.status(200).json({
    ranAt: new Date().toISOString(),
    dateRange: { startDate, endDate },
    scanned: filings.length,
    aboveThreshold: qualifying.length,
    added,
    skipped,
  });
}
