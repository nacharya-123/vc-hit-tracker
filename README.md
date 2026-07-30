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
