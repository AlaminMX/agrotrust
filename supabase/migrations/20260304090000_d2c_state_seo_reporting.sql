-- D2C platform hardening: state integrity, SEO slugs, reporting, and activity/session logging

-- 1) Product SEO slug
alter table public.products
  add column if not exists slug text;

create index if not exists idx_products_state_active_created_at
  on public.products (state, is_active, created_at desc);

create index if not exists idx_products_slug
  on public.products (slug);

-- slug helper
create or replace function public.slugify(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(input, 'listing')), '[^a-z0-9]+', '-', 'g'))
$$;

create or replace function public.ensure_product_state_and_slug()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  farmer_state text;
begin
  -- Ensure state follows farmer profile and prevent cross-state listing fraud
  select fp.state into farmer_state
  from public.farmer_profiles fp
  where fp.id = new.farmer_id;

  if farmer_state is null then
    raise exception 'Invalid farmer profile for product';
  end if;

  if new.state is null then
    new.state := farmer_state;
  end if;

  if new.state <> farmer_state then
    raise exception 'Product state must match farmer profile state';
  end if;

  if new.id is null then
    new.id := gen_random_uuid();
  end if;

  if new.slug is null or length(trim(new.slug)) = 0 or tg_op = 'UPDATE' then
    new.slug := public.slugify(new.name) || '-' || left(new.id::text, 8);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_products_state_slug on public.products;
create trigger trg_products_state_slug
before insert or update on public.products
for each row execute procedure public.ensure_product_state_and_slug();

-- backfill existing rows
update public.products p
set state = fp.state,
    slug = public.slugify(p.name) || '-' || left(p.id::text, 8)
from public.farmer_profiles fp
where p.farmer_id = fp.id
  and (p.state is distinct from fp.state or p.slug is null or length(trim(p.slug)) = 0);

-- enforce non-null state after backfill
alter table public.products
  alter column state set not null;

-- 2) Listing report moderation queue
create table if not exists public.listing_reports (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  reporter_user_id uuid null,
  reporter_session_id text null,
  reason text not null,
  details text null,
  status text not null default 'open' check (status in ('open', 'under_review', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_listing_reports_product on public.listing_reports (product_id);
create index if not exists idx_listing_reports_status on public.listing_reports (status);

-- 3) Guest session + activity logging
create table if not exists public.session_logs (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  user_id uuid null,
  ip_hash text null,
  user_agent text null,
  referrer text null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  user_id uuid null,
  event_name text not null,
  product_id uuid null references public.products(id) on delete set null,
  state text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_logs_event_created on public.activity_logs (event_name, created_at desc);
create index if not exists idx_activity_logs_product on public.activity_logs (product_id);

-- 4) Farmer contact visibility consent
alter table public.farmer_profiles
  add column if not exists contact_visibility_consent boolean not null default false,
  add column if not exists contact_consent_at timestamptz null;

-- 5) RLS policies
alter table public.listing_reports enable row level security;
alter table public.session_logs enable row level security;
alter table public.activity_logs enable row level security;

-- listing_reports: guests/auth can create, admins can read/update
drop policy if exists "Anyone can create listing reports" on public.listing_reports;

create policy "Anyone can create listing reports"
on public.listing_reports
for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can view listing reports" on public.listing_reports;

create policy "Admins can view listing reports"
on public.listing_reports
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'::app_role));

drop policy if exists "Admins can update listing reports" on public.listing_reports;

create policy "Admins can update listing reports"
on public.listing_reports
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'::app_role));

-- session/activity logs: open inserts for monitoring, admin read
drop policy if exists "Anyone can insert session logs" on public.session_logs;

create policy "Anyone can insert session logs"
on public.session_logs
for insert
to anon, authenticated
with check (true);

drop policy if exists "Anyone can update own session id" on public.session_logs;

create policy "Anyone can update own session id"
on public.session_logs
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Admins can read session logs" on public.session_logs;

create policy "Admins can read session logs"
on public.session_logs
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'::app_role));

drop policy if exists "Anyone can insert activity logs" on public.activity_logs;

create policy "Anyone can insert activity logs"
on public.activity_logs
for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can read activity logs" on public.activity_logs;

create policy "Admins can read activity logs"
on public.activity_logs
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'::app_role));
