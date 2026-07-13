
-- ehemehe.lk Enterprise Admin Dashboard Schema Helper
-- Run this in Supabase SQL Editor if any dashboard module says its table is missing.
-- Existing tables will not be dropped.

create extension if not exists pgcrypto;

create table if not exists public.staff_permissions (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role text not null default 'moderator',
  can_view_users boolean not null default false,
  can_approve_users boolean not null default false,
  can_view_ads boolean not null default true,
  can_approve_ads boolean not null default true,
  can_edit_ads boolean not null default false,
  can_delete_ads boolean not null default false,
  can_manage_categories boolean not null default false,
  can_manage_cities boolean not null default false,
  can_manage_moderators boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ad_reports (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid null,
  reporter_email text null,
  reason text null,
  message text null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  name text not null,
  phone text null,
  email text null,
  category text null,
  status text not null default 'active',
  logo_url text null,
  cover_url text null,
  description text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  user_email text null,
  type text not null default 'kyc',
  document_type text null,
  document_number text null,
  document_url text null,
  phone text null,
  status text not null default 'pending',
  note text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  user_email text null,
  gateway text null,
  reference text null,
  amount numeric not null default 0,
  currency text not null default 'LKR',
  status text not null default 'pending',
  product_type text null,
  product_id text null,
  paid_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pricing_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'promotion',
  price numeric not null default 0,
  duration_days integer not null default 30,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text unique null,
  user_id uuid null,
  user_email text null,
  amount numeric not null default 0,
  currency text not null default 'LKR',
  status text not null default 'pending',
  payment_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.custom_fields (
  id uuid primary key default gen_random_uuid(),
  category_id text null,
  name text null,
  label text not null,
  type text not null default 'text',
  options jsonb null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value text null,
  updated_at timestamptz not null default now()
);

create table if not exists public.banner_ads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text null,
  target_url text null,
  placement text not null default 'home_top',
  status text not null default 'active',
  start_at timestamptz null,
  end_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.add_staff_by_email(
  staff_email text,
  staff_role text default 'moderator',
  p_can_view_users boolean default false,
  p_can_approve_users boolean default false,
  p_can_view_ads boolean default true,
  p_can_approve_ads boolean default true,
  p_can_edit_ads boolean default false,
  p_can_delete_ads boolean default false,
  p_can_manage_categories boolean default false,
  p_can_manage_cities boolean default false,
  p_can_manage_moderators boolean default false
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user_id uuid;
begin
  select u.id into target_user_id
  from auth.users u
  where lower(u.email) = lower(staff_email)
  limit 1;

  insert into public.staff_permissions (
    id,email,role,
    can_view_users,can_approve_users,
    can_view_ads,can_approve_ads,can_edit_ads,can_delete_ads,
    can_manage_categories,can_manage_cities,can_manage_moderators,
    is_active,updated_at
  )
  values (
    coalesce(target_user_id, gen_random_uuid()), lower(staff_email), staff_role,
    p_can_view_users,p_can_approve_users,
    p_can_view_ads,p_can_approve_ads,p_can_edit_ads,p_can_delete_ads,
    p_can_manage_categories,p_can_manage_cities,p_can_manage_moderators,
    true,now()
  )
  on conflict (email) do update set
    role = excluded.role,
    can_view_users = excluded.can_view_users,
    can_approve_users = excluded.can_approve_users,
    can_view_ads = excluded.can_view_ads,
    can_approve_ads = excluded.can_approve_ads,
    can_edit_ads = excluded.can_edit_ads,
    can_delete_ads = excluded.can_delete_ads,
    can_manage_categories = excluded.can_manage_categories,
    can_manage_cities = excluded.can_manage_cities,
    can_manage_moderators = excluded.can_manage_moderators,
    is_active = true,
    updated_at = now();

  return 'Staff permissions saved';
end;
$$;

grant execute on function public.add_staff_by_email(text,text,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean) to authenticated;
