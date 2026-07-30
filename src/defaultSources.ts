// Reference list of newsletters/trackers worth checking during a sourcing
// pass. Curated for an oncology-focused digital health fund — mix of
// general digital health deal-flow newsletters and oncology-specific ones.
export const DEFAULT_SOURCES: { name: string; url: string; description: string }[] = [
  {
    name: "Oncology Ventures (Ben Freeberg)",
    url: "https://oncologyventures.substack.com/",
    description: "Written by an early-stage, cancer-focused VC fund — investment theses and deal commentary directly in your space.",
  },
  {
    name: "Second Opinion (Christina Farr)",
    url: "https://secondopinion.substack.com/",
    description: "Bi-weekly on the business of healthcare — funding rounds, product launches, regulatory shifts, care delivery models.",
  },
  {
    name: "Out-Of-Pocket (Nikhil Krishnan)",
    url: "https://www.outofpocket.health/",
    description: "Deep dives on healthcare business models and payer/provider economics — useful for the payer tech, RCM, and PA/denials themes.",
  },
  {
    name: "Rock Health Weekly",
    url: "https://rockhealth.com/insights/",
    description: "Longest-running digital health funding tracker — good for a fast weekly scan of new rounds across all your themes.",
  },
  {
    name: "Vital Signs (Jacob Effron)",
    url: "https://vitalsigns.substack.com/",
    description: "Health tech company and sub-sector breakdowns from a healthcare-focused VC.",
  },
  {
    name: "Fierce Healthcare / Fierce Oncology",
    url: "https://www.fiercehealthcare.com/",
    description: "Trade press with a running fundraising tracker (used as a source for several hits already in this tool) plus a dedicated oncology vertical.",
  },
  {
    name: "STAT News",
    url: "https://www.statnews.com/",
    description: "Biotech/pharma trade journalism — strong for drug approval timelines and clinical trial news relevant to the Drug/Therapy Acceleration lens.",
  },
  {
    name: "NCI SBIR/STTR Awards",
    url: "https://sbir.cancer.gov/",
    description: "Public database of National Cancer Institute small-business grant awardees — literally cancer-specific early research being commercialized, and it's a public government database (no ToS risk).",
  },
];
