-- ============================================================================
-- SellerCFO — Supabase Database Schema
-- Multi-tenant SaaS financial dashboard for e-commerce/DTC brands
-- Supabase Project: njqhrihwigienamvhidg (us-west-1)
-- ============================================================================

-- ============================================================================
-- ORGANIZATIONS (Tenants — each e-commerce brand is an organization)
-- ============================================================================
create table organizations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,

  -- QuickBooks Online integration
  qbo_realm_id text,
  qbo_access_token text,
  qbo_refresh_token text,
  qbo_token_expires_at timestamptz,

  -- Stripe billing
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text default 'trialing' check (subscription_status in ('trialing', 'active', 'past_due', 'canceled')),
  plan text default 'basic' check (plan in ('basic', 'pro', 'enterprise')),
  trial_ends_at timestamptz,

  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index organizations_stripe_customer_id_idx on organizations(stripe_customer_id);
create index organizations_stripe_subscription_id_idx on organizations(stripe_subscription_id);
create index organizations_slug_idx on organizations(slug);

-- ============================================================================
-- PROFILES (Users)
-- Extends Supabase auth.users with additional profile information
-- ============================================================================
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  organization_id uuid references organizations(id) on delete set null,
  role text default 'owner' check (role in ('owner', 'admin', 'viewer')),
  avatar_url text,
  created_at timestamptz default now()
);

create index profiles_organization_id_idx on profiles(organization_id);
create index profiles_email_idx on profiles(email);

-- ============================================================================
-- INTEGRATIONS (Sales channel connections)
-- ============================================================================
create table integrations (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references organizations(id) on delete cascade not null,
  provider text not null, -- 'shopify', 'amazon', 'etsy', 'woocommerce', 'walmart', 'tiktok_shop', 'qbo', 'salesforce', 'hubspot'
  status text default 'pending' check (status in ('pending', 'connected', 'error', 'disconnected')),

  -- OAuth tokens
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,

  -- Provider-specific config (store URL, realm ID, etc.)
  config jsonb default '{}'::jsonb,

  -- Sync tracking
  last_sync_at timestamptz,
  sync_error text,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(organization_id, provider)
);

create index integrations_org_id_idx on integrations(organization_id);
create index integrations_provider_idx on integrations(provider);

-- ============================================================================
-- DASHBOARD CACHE
-- Stores latest data pull for fast dashboard loads
-- ============================================================================
create table dashboard_snapshots (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references organizations(id) on delete cascade not null,
  data jsonb not null,
  pulled_at timestamptz default now()
);

create index dashboard_snapshots_organization_id_idx on dashboard_snapshots(organization_id);
create index dashboard_snapshots_pulled_at_idx on dashboard_snapshots(pulled_at desc);

-- ============================================================================
-- LEAD CAPTURES (Landing page signups, demo requests)
-- ============================================================================
create table lead_captures (
  id uuid default gen_random_uuid() primary key,
  name text,
  email text not null,
  company text,
  source text default 'landing', -- 'landing', 'chat', 'booking', 'lead_magnet'
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index lead_captures_email_idx on lead_captures(email);
create index lead_captures_created_at_idx on lead_captures(created_at desc);

-- ============================================================================
-- ADMIN METRICS (Analytics tracking)
-- ============================================================================
create table admin_metrics (
  id uuid default gen_random_uuid() primary key,
  event_type text not null, -- 'page_view', 'signup', 'trial_start', 'conversion', etc.
  event_data jsonb default '{}'::jsonb,
  user_id uuid references auth.users(id) on delete set null,
  organization_id uuid references organizations(id) on delete set null,
  created_at timestamptz default now()
);

create index admin_metrics_event_type_idx on admin_metrics(event_type);
create index admin_metrics_created_at_idx on admin_metrics(created_at desc);

-- ============================================================================
-- ERROR LOGS (Client-side error tracking)
-- ============================================================================
create table error_logs (
  id uuid default gen_random_uuid() primary key,
  message text not null,
  stack text,
  url text,
  user_id uuid references auth.users(id) on delete set null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index error_logs_created_at_idx on error_logs(created_at desc);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

alter table organizations enable row level security;
alter table profiles enable row level security;
alter table integrations enable row level security;
alter table dashboard_snapshots enable row level security;
alter table lead_captures enable row level security;
alter table admin_metrics enable row level security;
alter table error_logs enable row level security;

-- ORGANIZATIONS
create policy "Users can view own org" on organizations
  for select using (
    id = (select organization_id from profiles where id = auth.uid())
  );

create policy "Users can update own org" on organizations
  for update using (
    id = (select organization_id from profiles where id = auth.uid())
  );

-- PROFILES
create policy "Users can view own profile" on profiles
  for select using (id = auth.uid());

create policy "Users can view org members" on profiles
  for select using (
    organization_id = (select organization_id from profiles where id = auth.uid())
  );

create policy "Users can update own profile" on profiles
  for update using (id = auth.uid());

-- INTEGRATIONS
create policy "Users can view own integrations" on integrations
  for select using (
    organization_id = (select organization_id from profiles where id = auth.uid())
  );

create policy "Users can manage own integrations" on integrations
  for all using (
    organization_id = (select organization_id from profiles where id = auth.uid())
  );

-- DASHBOARD_SNAPSHOTS
create policy "Users can view own dashboard" on dashboard_snapshots
  for select using (
    organization_id = (select organization_id from profiles where id = auth.uid())
  );

-- LEAD_CAPTURES — insert only (public), no select
create policy "Anyone can insert leads" on lead_captures
  for insert with check (true);

-- ADMIN_METRICS — insert for authenticated users
create policy "Authenticated users can insert metrics" on admin_metrics
  for insert with check (auth.uid() is not null);

-- ERROR_LOGS — insert for anyone (captures pre-auth errors)
create policy "Anyone can insert errors" on error_logs
  for insert with check (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Handle new user registration
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update organization timestamps
create or replace function public.update_organization_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger organization_updated_at
  before update on organizations
  for each row execute procedure public.update_organization_timestamp();

-- Auto-update integration timestamps
create or replace function public.update_integration_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger integration_updated_at
  before update on integrations
  for each row execute procedure public.update_integration_timestamp();

-- ============================================================================
-- VIEWS
-- ============================================================================

create or replace view organizations_with_latest_snapshot as
select
  o.*,
  ds.data as latest_dashboard_data,
  ds.pulled_at as latest_pull_date
from organizations o
left join dashboard_snapshots ds on ds.organization_id = o.id and ds.pulled_at = (
  select max(pulled_at) from dashboard_snapshots where organization_id = o.id
);

create or replace view organization_members as
select
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.avatar_url,
  p.organization_id,
  p.created_at,
  o.name as organization_name
from profiles p
join organizations o on o.id = p.organization_id;

-- ============================================================================
-- COMMENTS
-- ============================================================================

comment on table organizations is 'Multi-tenant organizations (e-commerce brands)';
comment on table profiles is 'User profiles extending Supabase auth.users';
comment on table integrations is 'Sales channel and service connections (Shopify, Amazon, etc.)';
comment on table dashboard_snapshots is 'Cached dashboard data for fast loads';
comment on table lead_captures is 'Landing page and chat lead captures';
comment on table admin_metrics is 'Product analytics events';
comment on table error_logs is 'Client-side error tracking';
