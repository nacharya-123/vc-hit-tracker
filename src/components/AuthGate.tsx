import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "../supabaseClient";

export function AuthGate({ children }: { children: (session: Session) => React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (!supabaseConfigured) {
    return (
      <div className="auth-screen">
        <div className="panel auth-panel">
          <h2>Not configured</h2>
          <p className="empty">
            Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Set these as
            environment variables (see README) and reload.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="auth-screen">Loading…</div>;
  }

  if (!session) {
    async function sendLink(e: React.FormEvent) {
      e.preventDefault();
      setError("");
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) setError(error.message);
      else setSent(true);
    }

    return (
      <div className="auth-screen">
        <div className="panel auth-panel">
          <h1>VC Sourcing Hits Tracker</h1>
          {sent ? (
            <p>Check {email} for a sign-in link.</p>
          ) : (
            <form className="theme-form" onSubmit={sendLink}>
              <p className="empty">Sign in with your work email to access the team tracker.</p>
              <input
                type="email"
                placeholder="you@yourfirm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit">Send sign-in link</button>
              {error && <p className="warning">{error}</p>}
            </form>
          )}
        </div>
      </div>
    );
  }

  return <>{children(session)}</>;
}
