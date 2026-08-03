import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// Live-fetches a handful of RSS/Atom feeds on every request (no DB writes,
// no LLM calls, no cost) and turns each item into a short investor-facing
// digest entry: what it is, why it matters, and what to do next. Items that
// name a portfolio company are flagged as "Company lead"; everything else
// is tagged by market/policy signal. This is the "Yosemite Digest" tab's
// data source.

type Signal = "Company lead" | "Market signal" | "Policy signal" | "Podcast note";

type FeedConfig = {
  name: string;
  sourceUrl: string;
  feedUrl: string;
  format: string;
  signal: Signal;
  defaultTags: string[];
};

type FeedItem = {
  title: string;
  itemUrl: string;
  published: string;
  description: string;
};

type PulseItem = {
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
};

type SourceState = {
  source: string;
  status: "Live" | "Unavailable" | "Needs connector";
  itemCount: number;
  feedUrl?: string;
  error?: string;
};

const LIVE_FEEDS: FeedConfig[] = [
  {
    name: "KFF",
    sourceUrl: "https://www.kff.org/about-us/rss-feeds/",
    feedUrl: "https://www.kff.org/topic/health-costs/feed/",
    format: "Policy RSS",
    signal: "Policy signal",
    defaultTags: ["policy", "coverage", "buyer urgency"],
  },
  {
    name: "KFF Health News",
    sourceUrl: "https://kffhealthnews.org/rss-feeds/",
    feedUrl: "https://kffhealthnews.org/feed/",
    format: "News RSS",
    signal: "Policy signal",
    defaultTags: ["access", "care delivery", "health system"],
  },
  {
    name: "arXiv oncology + LLM scan",
    sourceUrl:
      "https://arxiv.org/search/?query=oncology+large+language+models&searchtype=all&abstracts=show&order=-announced_date_first&size=50",
    feedUrl:
      "https://export.arxiv.org/api/query?search_query=all:oncology+AND+all:%22large%20language%20model%22&sortBy=submittedDate&sortOrder=descending&max_results=5",
    format: "Research API",
    signal: "Market signal",
    defaultTags: ["oncology", "LLMs", "clinical validation"],
  },
  {
    name: "Home Health Care News",
    sourceUrl: "https://homehealthcarenews.com/subscribe/",
    feedUrl: "https://homehealthcarenews.com/feed/",
    format: "News RSS",
    signal: "Market signal",
    defaultTags: ["home health", "care delivery", "monitoring"],
  },
];

// Sources identified as valuable but not yet wired up (no public RSS/API,
// e.g. podcasts and paywalled newsletters) — surfaced in sourceStates so
// the digest is honest about coverage gaps instead of silently omitting them.
const CONNECTOR_BACKLOG = [
  "Healthcare AI Guy",
  "Healthcare Brew",
  "Healthcare Digest",
  "Heart of Healthcare",
  "TPBM tech AI podcast",
  "Sourcery by Molly O'Shea",
  "Ben's Bites",
  "StrictlyVC",
  "Axios Vitals",
  "Fortune Term Sheet",
];

function decodeEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCharCode(parseInt(code, 16)));
}

function stripHtml(value: string) {
  return decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tagValue(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? stripHtml(match[1]) : "";
}

function linkValue(block: string) {
  const atomHref = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i);
  if (atomHref?.[1]) return decodeEntities(atomHref[1]).trim();
  return tagValue(block, "link");
}

function parseFeed(xml: string): FeedItem[] {
  const itemBlocks = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((m) => m[0]);
  const entryBlocks = [...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map((m) => m[0]);
  const blocks = itemBlocks.length > 0 ? itemBlocks : entryBlocks;

  return blocks.slice(0, 5).map((block) => ({
    title: tagValue(block, "title") || "Untitled item",
    itemUrl: linkValue(block),
    published: tagValue(block, "pubDate") || tagValue(block, "updated") || tagValue(block, "published"),
    description:
      tagValue(block, "description") ||
      tagValue(block, "summary") ||
      tagValue(block, "content") ||
      tagValue(block, "content:encoded"),
  }));
}

function summarize(description: string, title: string) {
  const clean = stripHtml(description || title);
  if (clean.length <= 340) return clean;
  return `${clean.slice(0, 337).trim()}...`;
}

function mentionsAi(text: string) {
  return /\b(ai|llm|llms)\b|artificial intelligence|large language model|generative ai|gen-ai/i.test(text);
}

function classifyTags(text: string, defaults: string[]) {
  const lower = text.toLowerCase();
  const tags = new Set(defaults);

  if (lower.includes("cancer") || lower.includes("oncolog")) tags.add("oncology");
  if (lower.includes("medicare") || lower.includes("medicaid")) tags.add("government programs");
  if (lower.includes("payer") || lower.includes("insurance")) tags.add("payer");
  if (lower.includes("home") || lower.includes("hospice")) tags.add("home health");
  if (mentionsAi(text)) tags.add("AI");
  if (lower.includes("trial")) tags.add("clinical trials");
  if (lower.includes("drug") || lower.includes("pharma")) tags.add("pharma");
  if (lower.includes("cost") || lower.includes("billing")) tags.add("cost pressure");
  if (lower.includes("workforce") || lower.includes("staff")) tags.add("workforce");

  return [...tags].slice(0, 5);
}

function investorTakeaway(text: string, source: FeedConfig) {
  const lower = text.toLowerCase();

  if (lower.includes("oncolog") || lower.includes("cancer")) {
    return "Relevant if this points to an oncology care-delivery bottleneck, trial access problem, or reimbursement pressure that a workflow company can own.";
  }
  if (lower.includes("medicaid") || lower.includes("medicare") || lower.includes("coverage")) {
    return "Policy pressure can create buyer urgency — translate into payer, benefit-navigation, RCM, or care-access searches before promoting a company.";
  }
  if (lower.includes("home") || lower.includes("hospice")) {
    return "Care-at-home signal. Prioritize startups that make higher-acuity follow-up, staffing, documentation, or escalation measurable.";
  }
  if (mentionsAi(text)) {
    return "AI is investable here only if it attaches to a real budgeted workflow: patient follow-up, RCM, pharma services, trial matching, or clinical documentation.";
  }
  if (lower.includes("cost") || lower.includes("billing") || lower.includes("claim")) {
    return "Cost pressure strengthens payer-tech and RCM theses — look for tools tied to recovered revenue, reduced leakage, or faster reimbursement.";
  }
  return `${source.name} is useful as market context — use it to sharpen thesis keywords, then cross-check candidates against Company Hits.`;
}

function nextMove(text: string) {
  const lower = text.toLowerCase();

  if (lower.includes("oncolog") || lower.includes("cancer")) {
    return "Source oncology workflow, trial matching, navigation, and post-treatment follow-up companies against this theme.";
  }
  if (lower.includes("medicaid") || lower.includes("medicare") || lower.includes("coverage")) {
    return "Tag this to payer tech, ICHRA, access, or RCM and watch for startups selling into the policy shift.";
  }
  if (lower.includes("home") || lower.includes("hospice")) {
    return "Promote only companies with acuity, clinical escalation, or staffing workflow proof into Hits.";
  }
  if (mentionsAi(text)) {
    return "Convert the capability into thesis search terms for the next sourcing run.";
  }
  return "Keep as market context unless the same theme repeats across another source or names a relevant company.";
}

async function fetchFeed(source: FeedConfig, portfolioNames: string[]): Promise<PulseItem[]> {
  const response = await fetch(source.feedUrl, {
    headers: {
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
      "User-Agent": "YosemiteDigest/0.1 (+https://vc-hit-tracker.vercel.app)",
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`${source.name} returned ${response.status}`);
  }

  const xml = await response.text();
  return parseFeed(xml)
    .filter((item) => item.title && item.itemUrl)
    .slice(0, 3)
    .map((item) => {
      const combinedText = `${item.title}. ${item.description}`;
      const lowerText = combinedText.toLowerCase();
      const matchedCompany = portfolioNames.find(
        (name) => name.length > 2 && lowerText.includes(name.toLowerCase())
      );

      const tags = classifyTags(combinedText, source.defaultTags);
      const summary = summarize(item.description, item.title);

      return {
        source: source.name,
        sourceUrl: source.sourceUrl,
        itemUrl: item.itemUrl || source.sourceUrl,
        format: source.format,
        signal: matchedCompany ? "Company lead" : source.signal,
        title: item.title,
        summary,
        whyItMatters: matchedCompany
          ? `${matchedCompany} appears directly in this story — worth a quick portfolio check-in.`
          : investorTakeaway(combinedText, source),
        nextMove: matchedCompany ? `Follow up with ${matchedCompany} on this directly.` : nextMove(combinedText),
        tags,
        published: item.published || "Latest feed item",
        matchedCompany,
      } satisfies PulseItem;
    });
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  let portfolioNames: string[] = [];
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data } = await supabase.from("portfolio_companies").select("name");
    portfolioNames = (data ?? []).map((p) => p.name);
  }

  const settled = await Promise.allSettled(LIVE_FEEDS.map((source) => fetchFeed(source, portfolioNames)));
  const items: PulseItem[] = [];
  const sourceStates: SourceState[] = [];

  settled.forEach((result, index) => {
    const source = LIVE_FEEDS[index];
    if (result.status === "fulfilled" && result.value.length > 0) {
      items.push(...result.value);
      sourceStates.push({
        source: source.name,
        status: "Live",
        itemCount: result.value.length,
        feedUrl: source.feedUrl,
      });
    } else {
      sourceStates.push({
        source: source.name,
        status: "Unavailable",
        itemCount: 0,
        feedUrl: source.feedUrl,
        error:
          result.status === "rejected"
            ? result.reason instanceof Error
              ? result.reason.message
              : "Feed unavailable"
            : "No feed items returned",
      });
    }
  });

  CONNECTOR_BACKLOG.forEach((source) => {
    sourceStates.push({ source, status: "Needs connector", itemCount: 0 });
  });

  // Company leads first, then everything else newest-feed-order.
  items.sort((a, b) => (a.signal === "Company lead" ? -1 : 0) - (b.signal === "Company lead" ? -1 : 0));

  res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=300");
  return res.status(200).json({
    generatedAt: new Date().toISOString(),
    items,
    sourceStates,
  });
}
