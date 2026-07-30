import { useEffect, useState } from "react";
import type { FundProfile, Hit, PortfolioCompany, SourceLink, Theme } from "./types";
import { DEFAULT_FUND_PROFILE } from "./types";
import {
  fetchFundProfile,
  fetchHits,
  fetchPortfolio,
  fetchSources,
  fetchThemes,
  subscribeTable,
  syncHits,
  syncPortfolio,
  syncSources,
  syncThemes,
  updateFundProfile,
} from "./db";
import { supabase } from "./supabaseClient";
import { AuthGate } from "./components/AuthGate";
import { ThemesPanel } from "./components/ThemesPanel";
import { HitForm } from "./components/HitForm";
import { HitsTable } from "./components/HitsTable";
import { StatsBar } from "./components/StatsBar";
import { FundProfilePanel } from "./components/FundProfilePanel";
import { PortfolioPanel } from "./components/PortfolioPanel";
import { SourcesPanel } from "./components/SourcesPanel";
import "./App.css";

function Tracker({ userEmail }: { userEmail: string | undefined }) {
  const [loading, setLoading] = useState(true);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [hits, setHits] = useState<Hit[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioCompany[]>([]);
  const [sources, setSources] = useState<SourceLink[]>([]);
  const [fundProfile, setFundProfile] = useState<FundProfile>(DEFAULT_FUND_PROFILE);
  const [syncError, setSyncError] = useState("");

  useEffect(() => {
    Promise.all([fetchThemes(), fetchHits(), fetchPortfolio(), fetchSources(), fetchFundProfile()])
      .then(([t, h, p, s, f]) => {
        setThemes(t);
        setHits(h);
        setPortfolio(p);
        setSources(s);
        if (f) setFundProfile(f);
        setLoading(false);
      })
      .catch((err) => {
        setSyncError(String(err.message ?? err));
        setLoading(false);
      });

    const unsubs = [
      subscribeTable("themes", () => fetchThemes().then(setThemes)),
      subscribeTable("hits", () => fetchHits().then(setHits)),
      subscribeTable("portfolio_companies", () => fetchPortfolio().then(setPortfolio)),
      subscribeTable("source_links", () => fetchSources().then(setSources)),
      subscribeTable("fund_profile", () => fetchFundProfile().then((f) => f && setFundProfile(f))),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  async function handleThemesChange(next: Theme[]) {
    const prev = themes;
    setThemes(next);
    try {
      await syncThemes(prev, next);
    } catch (err: any) {
      setSyncError(err.message ?? String(err));
      setThemes(prev);
    }
  }

  async function handleHitsChange(next: Hit[]) {
    const prev = hits;
    setHits(next);
    try {
      await syncHits(prev, next);
    } catch (err: any) {
      setSyncError(err.message ?? String(err));
      setHits(prev);
    }
  }

  async function handlePortfolioChange(next: PortfolioCompany[]) {
    const prev = portfolio;
    setPortfolio(next);
    try {
      await syncPortfolio(prev, next);
    } catch (err: any) {
      setSyncError(err.message ?? String(err));
      setPortfolio(prev);
    }
  }

  async function handleSourcesChange(next: SourceLink[]) {
    const prev = sources;
    setSources(next);
    try {
      await syncSources(prev, next);
    } catch (err: any) {
      setSyncError(err.message ?? String(err));
      setSources(prev);
    }
  }

  async function handleFundProfileChange(next: FundProfile) {
    const prev = fundProfile;
    setFundProfile(next);
    try {
      await updateFundProfile(next);
    } catch (err: any) {
      setSyncError(err.message ?? String(err));
      setFundProfile(prev);
    }
  }

  if (loading) {
    return <div className="auth-screen">Loading…</div>;
  }

  return (
    <div className="app">
      <header>
        <div className="header-row">
          <div>
            <h1>VC Sourcing Hits Tracker</h1>
            <p className="subtitle">
              Log companies you source against your investment themes, track them
              through review, and mark them once they've been pushed to Affinity.
            </p>
          </div>
          <div className="header-account">
            <span className="muted">{userEmail}</span>
            <button className="link-btn" onClick={() => supabase.auth.signOut()}>
              Sign out
            </button>
          </div>
        </div>
        {syncError && <p className="warning">Sync error: {syncError}</p>}
      </header>

      <StatsBar hits={hits} />

      <div className="layout">
        <div className="column">
          <FundProfilePanel profile={fundProfile} onChange={handleFundProfileChange} />
          <SourcesPanel sources={sources} onChange={handleSourcesChange} />
          <PortfolioPanel portfolio={portfolio} onChange={handlePortfolioChange} />
          <ThemesPanel themes={themes} onChange={handleThemesChange} />
          <HitForm themes={themes} portfolio={portfolio} onAdd={(h) => handleHitsChange([...hits, h])} />
        </div>
        <div className="column column-wide">
          <HitsTable hits={hits} themes={themes} onChange={handleHitsChange} />
        </div>
      </div>
    </div>
  );
}

function App() {
  return <AuthGate>{(session) => <Tracker userEmail={session.user.email} />}</AuthGate>;
}

export default App;
