import type { OncologyRelevance } from "./types";

export interface SeedHit {
  themeName: string;
  company: string;
  website: string;
  source: string;
  notes: string;
  oncologyRelevance: OncologyRelevance;
}

// Populated from a live web-research pass (July 2026) against the firm's
// themes. Every entry is grounded in a real, cited article — nothing
// fabricated. Round sizes/stages are noted so you can judge fit against
// the $5-15M seed/A check size before reaching out.
//
// oncologyRelevance is scored by tracing the actual chain of effect to a
// cancer patient (or someone who might become one) — not just whether the
// company says "oncology" anywhere. Multi-hop chains count: a PCP tool
// affects screening/early diagnosis timing; a prior-auth or specialty
// pharmacy tool gates access to extremely expensive cancer drugs even
// though neither looks oncology-specific on its face. Each entry's notes
// spell out the chain so you can judge how direct vs. diffuse it is.
export const SEED_HITS: SeedHit[] = [
  {
    themeName: "Gen-AI Patient Front Door / Follow-Up",
    company: "Prosper AI",
    website: "https://www.getprosper.ai",
    source: "https://www.healthcareittoday.com/2025/10/30/prosper-ai-raises-5m-to-be-the-default-voice-ai-platform-for-healthcares-450b-admin-crisis/",
    notes: "$5M seed (Emergence Capital, YC, CRV) — voice AI for healthcare front/back-office workflows. Fits check size well. Chain: if deployed by an oncology practice, handles post-chemo symptom-check calls and follow-up scheduling — the calls that get skipped when staff are overloaded. Horizontal product, oncology is one of many possible verticals; worth asking directly whether they have oncology customers.",
    oncologyRelevance: "Direct Cancer Care Delivery",
  },
  {
    themeName: "Gen-AI Patient Front Door / Follow-Up",
    company: "VoiceCare AI",
    website: "",
    source: "https://www.prnewswire.com/news-releases/agentic-ai-startup-voicecare-ai-completes-successful-funding-round-302488165.html",
    notes: "$4.54M seed (Caduceus Capital Partners; Mayo Clinic participated) — voice AI agent \"Joy\" automates payer comms, prior auth, claims. Just under typical check size. Chain: faster prior-auth turnaround directly shortens the wait between an oncology diagnosis/treatment plan and the patient actually starting therapy.",
    oncologyRelevance: "Both",
  },
  {
    themeName: "Payer Tech - Appeals, Denials & Payment Integrity",
    company: "Anterior",
    website: "",
    source: "https://startupintros.com/orgs/anterior",
    notes: "$63M raised across 3 rounds — automates prior authorization and clinical review tasks for health plans. Verify current round size/stage vs. fund target. Chain: this is the textbook prior-auth/denials case — cancer therapies are among the most expensive and most frequently delayed by PA, so faster/fairer PA has an outsized effect on time-to-treatment for cancer patients specifically.",
    oncologyRelevance: "Both",
  },
  {
    themeName: "Payer Tech - Appeals, Denials & Payment Integrity",
    company: "Cohere Health",
    website: "",
    source: "https://intuitionlabs.ai/articles/cohere-health-ai-prior-authorization",
    notes: "More established player in AI-driven prior authorization — useful as a landscape comp rather than a fresh seed target. Same chain as Anterior: PA delay/denial directly gates access to expensive cancer treatment.",
    oncologyRelevance: "Both",
  },
  {
    themeName: "Gen-AI in RCM",
    company: "Procode AI",
    website: "",
    source: "https://www.fiercehealthcare.com/ai-and-machine-learning/armed-funding-and-acquisition-procode-ai-launches-ai-powered-rcm-medical",
    notes: "AI-powered RCM for surgical billing in private practice; added $2M ARR in 5 months post-acquisition. Chain: RCM health keeps independent surgical practices (including surgical oncology) financially viable — billing dysfunction is a real driver of community practice closures, which directly reduces local access to cancer surgery.",
    oncologyRelevance: "Direct Cancer Care Delivery",
  },
  {
    themeName: "AI Scribes for Non-Health-System (SMB)",
    company: "Freed AI",
    website: "",
    source: "https://www.commure.com/blog-scribe/scribe-pricing",
    notes: "Self-serve AI scribe priced $39-119/provider/month — squarely targets independent/SMB practices. Chain: documentation burden is a leading driver of physician burnout and early retirement/practice closure, especially in independent community oncology and primary care — both of which shape whether cancer patients have a local practice at all.",
    oncologyRelevance: "Direct Cancer Care Delivery",
  },
  {
    themeName: "Home Health Tech",
    company: "Axle Health",
    website: "",
    source: "https://www.prnewswire.com/news-releases/axle-health-secures-10m-in-series-a-financing-to-revolutionize-home-health-operations-302462151.html",
    notes: "$10M Series A led by F-Prime, with YC, Pear VC, Lightbank — AI logistics/scheduling for in-home clinician visits. 900% FY24 growth, fits check size well. Chain: home infusion and home-based symptom management are a growing cancer-care delivery model; logistics platforms are the enabling infrastructure for that shift. Worth asking directly about oncology/infusion volume.",
    oncologyRelevance: "Direct Cancer Care Delivery",
  },
  {
    themeName: "ICHRA & Employer-Driven Payer Decisions",
    company: "Kyra Health",
    website: "",
    source: "https://www.cbinsights.com/company/kyra-health",
    notes: "Founded 2025, early seed stage — ICHRA solution for employers/employees. Very early. Chain: plan design set through ICHRA determines whether someone has a PCP relationship for routine screening (the earlier a cancer is caught, the more treatable it is) and what they pay out-of-pocket for specialty cancer drugs once diagnosed — a real but multi-hop chain.",
    oncologyRelevance: "Direct Cancer Care Delivery",
  },
  {
    themeName: "Next Generation EMRs",
    company: "Knit Health",
    website: "",
    source: "https://www.fiercehealthcare.com/health-tech/fierce-healthcare-fundraising-tracker-26",
    notes: "$11.6M seed — \"Large Clinical Behavior Model\" built on Truveta EMR data spanning 130M+ patients across 30 health systems. Fits check size well. Chain: a model trained on this much longitudinal EMR data is plausible infrastructure for risk stratification and earlier cancer-screening triggers inside routine primary-care encounters.",
    oncologyRelevance: "Direct Cancer Care Delivery",
  },
  {
    themeName: "Next Generation EMRs",
    company: "Honey Health",
    website: "",
    source: "https://www.fiercehealthcare.com/health-tech/fierce-healthcare-fundraising-tracker-26",
    notes: "$7.8M seed — AI agents that log into existing EHRs and autonomously complete full workflows end-to-end. Dual fit with Computer Use Agents theme. Chain: frees clinician time from EHR busywork back into patient-facing time — including the minutes it takes to flag an at-risk patient for screening or follow up on an abnormal result.",
    oncologyRelevance: "Direct Cancer Care Delivery",
  },
  {
    themeName: "Data Infrastructure for Model Development / Data Marketplaces",
    company: "Protege Health",
    website: "",
    source: "https://siliconangle.com/2026/01/08/protege-raises-30m-grow-governed-marketplace-ai-training-data/",
    notes: "$30M raised — governed marketplace for AI training data. Round size above typical check. Chain: better-governed, more available clinical training data speeds up development of both cancer-detection models and drug-discovery models — ask specifically what share of their data network is oncology/pathology.",
    oncologyRelevance: "Drug/Therapy Acceleration",
  },
  {
    themeName: "Radiation Oncology Innovation",
    company: "Artbio",
    website: "",
    source: "https://www.biopharmadive.com/news/artbio-series-b-radiopharma-prostate-cancer/754232/",
    notes: "$132M Series B (Sofinnova, B Capital) — radiopharma (radioligand therapy) targeting prostate cancer. Later-stage than the fund's typical check, but directly on-thesis: new cancer treatment modality (care delivery) and a drug racing toward approval (time-to-market). Best used for market-mapping / finding an earlier-stage comp.",
    oncologyRelevance: "Both",
  },
  {
    themeName: "Community Oncology Practice Landscape",
    company: "Previvor Edge",
    website: "",
    source: "https://medcitynews.com/2025/10/startupdate-new-developments-for-healthcare-startups/",
    notes: "$3.3M pre-seed (CoFound Partners, Max Ventures) — cancer prevention & early detection. Pre-seed, slightly below typical check size but the most direct fit in this batch: earlier detection directly changes the care-delivery trajectory for cancer patients, one hop.",
    oncologyRelevance: "Direct Cancer Care Delivery",
  },
  {
    themeName: "AI Orchestration for Preclinical In Vivo Studies",
    company: "Excelsior Sciences",
    website: "",
    source: "https://xtalks.com/biotech-funding-2025-tracker-follow-the-latest-raises-rounds-and-rd-momentum-4542/",
    notes: "$95M total incl. $70M Series A — \"smart bloccs\" modular chemistry platform machines can run and AI can learn from. Round well above typical check. Chain: faster preclinical iteration shortens the path to IND for any therapeutic program run on the platform, including oncology programs — confirm what share of client pipelines are oncology.",
    oncologyRelevance: "Drug/Therapy Acceleration",
  },
  {
    themeName: "Computer Use Agents for Clinical & Admin Workflows",
    company: "Attuned Intelligence",
    website: "",
    source: "https://www.fiercehealthcare.com/health-tech/fierce-healthcare-fundraising-tracker-26",
    notes: "$13M (Oct 2025) — hospital call center AI agents. Fits check size range well. Chain: call-center responsiveness affects how fast a patient gets a screening appointment booked or a post-treatment question answered — a real but fairly diffuse, hospital-wide chain rather than cancer-specific.",
    oncologyRelevance: "Direct Cancer Care Delivery",
  },
  {
    themeName: "Clinical Staff Inbox Management",
    company: "Affineon Health",
    website: "",
    source: "https://www.prnewswire.com/news-releases/ai-startup-secures-5m-to-power-physician-productivity-302366467.html",
    notes: "$5M oversubscribed seed (GPG Ventures, AI Fund) — AI to streamline the physician/provider inbox. Fits check size well. Chain: inbox overload is exactly where a patient-reported concerning symptom (e.g. a new lump, unexplained pain) can sit unread for days — faster triage here has a direct, if unglamorous, effect on time-to-diagnosis.",
    oncologyRelevance: "Direct Cancer Care Delivery",
  },
  {
    themeName: "What's Next in Clinical Trials?",
    company: "Iambic",
    website: "",
    source: "https://medcitynews.com/2025/11/startup-iambic-raises-100m-for-clinical-trials-of-ai-discovered-cancer-drugs/",
    notes: "$100M raised — AI-discovered cancer drug entering clinical trials. Directly on-thesis: AI is compressing the drug-discovery-to-trial timeline for a cancer therapeutic. Round size is well above typical check; look for earlier rounds or comparable earlier-stage companies in AI-driven oncology drug discovery.",
    oncologyRelevance: "Drug/Therapy Acceleration",
  },
  {
    themeName: "Specialty Pharmacy",
    company: "House Rx",
    website: "",
    source: "https://www.prnewswire.com/news-releases/house-rx-raises-55-million-to-scale-in-clinic-specialty-pharmacy-model-302612560.html",
    notes: "$55M Series B (NEA, Town Hall Ventures) — in-clinic specialty pharmacy model plus AI-enabled pharmacy management. Later-stage than typical check. Chain: this is the specialty-pharmacy example directly — oncology drugs are among the most expensive specialty medications, and in-clinic dispensing plus better pharmacy ops directly affects whether a patient actually starts and stays on therapy. Confirm oncology share of their book.",
    oncologyRelevance: "Both",
  },
  {
    themeName: "Asynchronous Medical Care Platforms",
    company: "Doctor.One",
    website: "",
    source: "https://www.eu-startups.com/2025/09/polish-health-platform-doctor-one-secures-e4-million-to-expand-its-asynchronous-care-model-for-chronic-patients/",
    notes: "€4M seed — asynchronous chronic-care platform (Poland, expanding to Germany/Spain/UK). Slightly below typical check size; EU-based, confirm US strategy fit. Chain: continuous async contact with a chronic-care provider is exactly the kind of relationship that catches new symptoms early — but the product is generically chronic-care, not cancer-specific, and the chain is the most diffuse in this batch.",
    oncologyRelevance: "Indirect / General Healthtech",
  },
];
