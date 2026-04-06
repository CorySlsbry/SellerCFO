-- ============================================================================
-- Contractor CFO Dashboard - Supabase Database Schema
-- Multi-tenant SaaS for contractor bookkeeping
-- ============================================================================

-- ============================================================================
-- ORGANIZATIONS (Tenants)
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

  -- Stripe integration
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text default 'trialing' check (subscription_status in ('trialing', 'active', 'past_due', 'canceled')),
  plan text default 'basic' check (plan in ('basic', 'pro', 'enterprise')),

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
-- DASHBOARD CACHE
-- Stores latest QBO data pull for fast dashboard loads
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
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table dashboard_snapshots enable row level security;

-- ORGANIZATIONS - Users can view their own organization
create policy "Users can view own org" on organizations
  for select using (
    id = (select organization_id from profiles where id = auth.uid())
  );

create policy "Users can update own org" on organizations
  for update using (
    id = (select organization_id from profiles where id = auth.uid())
  );

-- PROFILES - Users can view their own profile
create policy "Users can view own profile" on profiles
  for select using (id = auth.uid());

create policy "Users can view org members" on profiles
  for select using (
    organization_id = (select organization_id from profiles where id = auth.uid())
  );

-- Allow users to update their own profile
create policy "Users can update own profile" on profiles
  for update using (id = auth.uid());

-- DASHBOARD_SNAPSHOTS - Users can view their organization's snapshots
create policy "Users can view own dashboard" on dashboard_snapshots
  for select using (
    organization_id = (select organization_id from profiles where id = auth.uid())
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to handle new user registration
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Trigger for new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update organization updated_at timestamp
create or replace function public.update_organization_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for organization updates
create trigger organization_updated_at
  before update on organizations
  for each row execute procedure public.update_organization_timestamp();

-- ============================================================================
-- VIEWS (Optional - for convenience)
-- ============================================================================

-- View for organization with latest dashboard snapshot
create or replace view organizations_with_latest_snapshot as
select
  o.*,
  ds.data as latest_dashboard_data,
  ds.pulled_at as latest_pull_date
from organizations o
left join dashboard_snapshots ds on ds.organization_id = o.id and ds.pulled_at = (
  select max(pulled_at) from dashboard_snapshots where organization_id = o.id
);

-- View for organization members
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
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

comment on table organizations is 'Multi-tenant organizations (contractor companies)';
comment on column organizations.qbo_realm_id is 'QuickBooks Online realm ID for API calls';
comment on column organizations.qbo_access_token is 'OAuth access token for QBO (encrypted in production)';
comment on column organizations.qbo_refresh_token is 'OAuth refresh token for QBO (encrypted in production)';

comment on table profiles is 'User profiles extending Supabase auth.users';
comment on column profiles.role is 'User role: owner (full access), admin (most access), viewer (read-only)';

comment on table dashboard_snapshots is 'Cached dashboard data from latest QBO pull';
comment on column dashboard_snapshots.data is 'JSON snapshot of financial data for fast dashboard loads';
