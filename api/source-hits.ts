import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

// Scheduled by vercel.json to run nightly. On each run, picks a handful of
// themes, asks Claude to research real candidate companies against them
// (using the web_search server tool, grounded — not fabricated), dedupes
// against the portfolio and existing hits, and inserts the rest into the
// shared `hits` table as status "New" for human review the next morning.
//
// Requires these Vercel env vars (server-side only, never exposed to the
// browser): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY,
// CRON_SECRET (Vercel sets this automatically for Cron-triggered requests;
// this handler checks it so the endpoint can't be triggered by anyone else).

const THEMES_PER_RUN = 20;
const MAX_CANDIDATES_PER_THEME = 2;
const BATCH_SIZE = 5;

interface Candidate {
  company: string;
  website: string;
  source: string;
  notes: string;
  oncologyRelevance:
    | "Direct Cancer Care Delivery"
    | "Drug/Therapy Acceleration"
    | "Both"
    | "Indirect / General Healthtech"
    | "Needs Assessment";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const [fundProfileRes, themesRes, portfolioRes, existingHitsRes] = await Promise.all([
    supabase.from("fund_profile").select("*").eq("id", 1).maybeSingle(),
    supabase.from("themes").select("*").order("id"),
    supabase.from("portfolio_companies").select("name"),
    supabase.from("hits").select("company"),
  ]);
  const { data: fundProfile } = fundProfileRes;
  const { data: themes } = themesRes;
  const { data: portfolio } = portfolioRes;
  const { data: existingHits } = existingHitsRes;

  if (!fundProfile || !themes || themes.length === 0) {
    return res.status(500).json({
      error: "No fund profile or themes found",
      fundProfileError: fundProfileRes.error?.message ?? null,
      themesError: themesRes.error?.message ?? null,
      supabaseUrlUsed: process.env.SUPABASE_URL ?? null,
    });
  }

  const knownNames = new Set([
    ...(portfolio ?? []).map((p) => p.name.toLowerCase()),
    ...(existingHits ?? []).map((h) => h.company.toLowerCase()),
  ]);

  // Deterministic day-based rotation (not random) so every theme actually
  // gets covered on a predictable cadence instead of leaving coverage to
  // chance across nightly runs.
  const daysSinceEpoch = Math.floor(Date.now() / 86_400_000);
  const startIndex = daysSinceEpoch % themes.length;
  const targetThemes = Array.from(
    { length: Math.min(THEMES_PER_RUN, themes.length) },
    (_, i) => themes[(startIndex + i) % themes.length]
  );

  async function researchTheme(theme: { id: number; name: string; description: string | null }) {
    const prompt = `You are sourcing seed/Series A investment candidates for a venture fund.

Fund investment lens: ${fundProfile.investment_lens}
Sector focus: ${fundProfile.sector_focus}
Stages: ${fundProfile.stages}
Check size: $${fundProfile.check_size_min}M-$${fundProfile.check_size_max}M (${fundProfile.check_size_flex_note})

Current theme to research: "${theme.name}" — ${theme.description || "(no additional description)"}

Use web search to find up to ${MAX_CANDIDATES_PER_THEME} real, currently-operating startups that plausibly fit this theme and the fund's stage/check size. For each one, trace the actual chain of effect to a cancer patient per the investment lens above (direct or multi-hop), and be honest if a company is a weak/indirect fit.

Do not include any company already known to the fund: ${[...knownNames].join(", ") || "(none yet)"}.

Respond with ONLY a JSON array (no other text) in this exact shape, using real information from your search results — never invent a company or source URL:
[
  {
    "company": "string",
    "website": "string (their real site, or empty string if unknown)",
    "source": "string (a real URL from your search results backing this entry)",
    "notes": "string (round size/stage if known, then 'Chain: ...' explaining the cancer-patient connection)",
    "oncologyRelevance": "Direct Cancer Care Delivery" | "Drug/Therapy Acceleration" | "Both" | "Indirect / General Healthtech" | "Needs Assessment"
  }
]
If you find no credible real candidates for this theme, respond with an empty array: []`;

    const response = await anthropic.messages.create({
      model: "claude-opus-5",
      max_tokens: 4096,
      output_config: { effort: "medium" },
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 4 }],
      messages: [{ role: "user", content: prompt }],
    });

    const lastText = [...response.content].reverse().find((b) => b.type === "text");
    let candidates: Candidate[] = [];
    if (lastText && lastText.type === "text") {
      const match = lastText.text.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          candidates = JSON.parse(match[0]);
        } catch {
          candidates = [];
        }
      }
    }

    const added: string[] = [];
    const skipped: string[] = [];
    for (const c of candidates) {
      if (!c.company || knownNames.has(c.company.toLowerCase())) {
        skipped.push(c.company ?? "(unnamed)");
        continue;
      }
      const { error } = await supabase.from("hits").insert({
        company: c.company,
        website: c.website ?? "",
        theme_id: theme.id,
        source: c.source ?? "",
        notes: c.notes ?? "",
        status: "New",
        oncology_relevance: c.oncologyRelevance ?? "Needs Assessment",
      });
      if (error) {
        skipped.push(`${c.company} (${error.message})`);
      } else {
        knownNames.add(c.company.toLowerCase());
        added.push(c.company);
      }
    }
    return { theme: theme.name, added, skipped };
  }

  // Research themes in small concurrent batches rather than one at a time —
  // 20 sequential Claude calls (each doing its own web searches) would run
  // well past Vercel's function timeout. Batching keeps wall-clock time down
  // while staying under a personal API account's concurrency limits.
  const results: { theme: string; added: string[]; skipped: string[] }[] = [];
  for (let i = 0; i < targetThemes.length; i += BATCH_SIZE) {
    const batch = targetThemes.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map((theme) => researchTheme(theme)));
    results.push(...batchResults);
  }

  return res.status(200).json({ ranAt: new Date().toISOString(), results });
}
