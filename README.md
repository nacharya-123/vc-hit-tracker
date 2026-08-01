# VC Hits Tracker

A shared sourcing tracker for an oncology-focused digital health fund: log
companies found against investment themes, screen them against the fund's
investment lens, track them through review, and mark them once pushed to
Affinity. Backed by Supabase (Postgres + auth) so the whole team shares one
live dataset.

## One-time setup (whoever sets this up for the firm)

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com), sign up (free tier, no card
   required), and create a new project.
2. In the Supabase dashboard, open **SQL Editor** and run, in order:
   - `supabase/migrations/0001_init.sql` (creates tables + access policies)
   - `supabase/migrations/0002_seed.sql` (loads the firm's themes, portfolio,
     source list, and starter hits)
3. Go to **Authentication → Providers** and confirm "Email" is enabled
   (it is by default). This app signs people in with a passwordless magic
   link — no password to manage.
4. Optional but recommended: **Authentication → Settings** lets you restrict
   sign-ups to your firm's email domain, so a stranger who finds the URL
   can't request a sign-in link. Worth doing before sharing the link widely.
5. Go to **Settings → API** and copy the **Project URL** and the **anon
   public key** — you'll need both for step 3 below.

### 2. Deploy the frontend (Vercel, free tier)

1. Go to [vercel.com](https://vercel.com), sign up, and "Import Project"
   from this GitHub repo.
2. In the project's **Environment Variables** settings, add:
   - `VITE_SUPABASE_URL` = the Project URL from above
   - `VITE_SUPABASE_ANON_KEY` = the anon public key from above
3. Deploy. Every push to the main branch redeploys automatically from then
   on.

### 3. Invite the team

Share the deployed URL. Anyone on the team enters their email, gets a
magic link, clicks it, and is in — no separate account creation. Everyone
sees and edits the same shared data in real time.

### 4. (Optional) Turn on nightly automated sourcing

A scheduled job (`api/source-hits.ts`, wired up in `vercel.json` as a Vercel
Cron) can research new candidate companies against your themes every night
and drop them into the tracker as "New" hits for review — the automation
piece from the original ask. It's off by default until you add these three
environment variables in Vercel (**Settings → Environment Variables**):

- `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com);
  this is real, usage-based billing — roughly $0.05-$0.15 per theme researched
  (Claude tokens + web search), so around $1-$3 per nightly run at the default
  20 themes/run, researched in concurrent batches of 5 to stay under Vercel's
  function timeout
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase **Settings → API Keys** (the
  `service_role` key, *not* the anon/publishable one — it bypasses row-level
  security so the nightly job can write without a logged-in user; treat it
  as a secret, never put it in `VITE_`-prefixed vars or client code)
- `SUPABASE_URL` — same Project URL as `VITE_SUPABASE_URL`, just under a
  non-public name since this one's read server-side
- `CRON_SECRET` — any random string you make up (e.g. `openssl rand -hex 32`);
  Vercel automatically sends it as a bearer token on Cron-triggered
  requests, and the function checks it so nobody else can trigger paid API
  calls by hitting the URL directly

Once those are set, redeploy and it starts running on the schedule in
`vercel.json` (default: 9am UTC daily — edit the cron expression there to
change it). You can also trigger a run manually anytime by opening
`https://your-app.vercel.app/api/source-hits` with the right
`Authorization: Bearer <CRON_SECRET>` header (e.g. via `curl`), which is
useful for testing before waiting for the schedule.

## Local development

```sh
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

## Regenerating the seed data

The starter themes/portfolio/sources/hits live as TypeScript in `src/`
(`defaultThemes.ts`, `defaultPortfolio.ts`, `defaultSources.ts`,
`seedHits.ts`) so they're easy to review and edit. If you change them and
want a fresh Supabase project pre-populated again, regenerate the SQL with:

```sh
npm run db:gen-seed
```

This only matters for bootstrapping a *new* project — it does not affect
already-running data, since the app talks to Supabase directly from then on.
