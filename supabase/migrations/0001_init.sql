-- VC Hits Tracker schema.
-- Shared-team model: any authenticated user of this project can read/write
-- everything. There is no per-user row ownership — the whole firm sees the
-- same themes/hits/portfolio. Auth is handled by Supabase Auth (magic link);
-- restricting who can sign in at all is done in the Supabase dashboard
-- (Authentication > Settings > allowed email domains), not in this schema.

create extension if not exists "pgcrypto";

create table fund_profile (
  id int primary key default 1,
  sector_focus text not null default '',
  stages text not null default '',
  check_size_min int not null default 0,
  check_size_max int not null default 0,
  check_size_flex_note text not null default '',
  investment_lens text not null default '',
  constraint fund_profile_singleton check (id = 1)
);

create table themes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table portfolio_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text not null default ''
);

create table source_links (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  description text not null default ''
);

create table hits (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  website text not null default '',
  theme_id uuid references themes(id) on delete set null,
  source text not null default '',
  notes text not null default '',
  status text not null default 'New',
  oncology_relevance text not null default 'Needs Assessment',
  added_date timestamptz not null default now(),
  affinity_pushed_date timestamptz
);

alter table fund_profile enable row level security;
alter table themes enable row level security;
alter table portfolio_companies enable row level security;
alter table source_links enable row level security;
alter table hits enable row level security;

-- Any signed-in team member can read/write any row in any table.
create policy "authenticated full access" on fund_profile for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on themes for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on portfolio_companies for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on source_links for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on hits for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
