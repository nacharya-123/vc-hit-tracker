export type HitStatus =
  | "New"
  | "Reviewing"
  | "Approved"
  | "Passed"
  | "Pushed to Affinity";

export const HIT_STATUSES: HitStatus[] = [
  "New",
  "Reviewing",
  "Approved",
  "Passed",
  "Pushed to Affinity",
];

export interface Theme {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface PortfolioCompany {
  id: string;
  name: string;
  website: string;
}

export interface SourceLink {
  id: string;
  name: string;
  url: string;
  description: string;
}

export type OncologyRelevance =
  | "Direct Cancer Care Delivery"
  | "Drug/Therapy Acceleration"
  | "Both"
  | "Indirect / General Healthtech"
  | "Needs Assessment";

export const ONCOLOGY_RELEVANCE_OPTIONS: OncologyRelevance[] = [
  "Direct Cancer Care Delivery",
  "Drug/Therapy Acceleration",
  "Both",
  "Indirect / General Healthtech",
  "Needs Assessment",
];

export interface Hit {
  id: string;
  company: string;
  website: string;
  themeId: string;
  source: string;
  notes: string;
  status: HitStatus;
  oncologyRelevance: OncologyRelevance;
  addedDate: string;
  affinityPushedDate?: string;
}

export interface FundProfile {
  sectorFocus: string;
  stages: string;
  checkSizeMin: number;
  checkSizeMax: number;
  checkSizeFlexNote: string;
  investmentLens: string;
}

export const DEFAULT_FUND_PROFILE: FundProfile = {
  sectorFocus: "Oncology-focused healthtech & digital health",
  stages: "Seed – Series A (sometimes Series B)",
  checkSizeMin: 5,
  checkSizeMax: 15,
  checkSizeFlexNote: "can flex up to +5 / down to -2",
  investmentLens:
    "Trace the actual chain of effect: how could this affect a cancer patient — or someone who might eventually become one — either in care delivery or in getting a life-changing drug/therapy to market faster? Think in hops, not just direct oncology products. E.g. routine PCP tools affect screening/early diagnosis timing; specialty pharmacy and prior-auth tools gate access to extremely expensive cancer drugs even though they don't look oncology-specific on the surface. Score the strength of that chain honestly (direct vs. multi-hop/diffuse) rather than requiring the company to say 'oncology' anywhere in its pitch.",
};
