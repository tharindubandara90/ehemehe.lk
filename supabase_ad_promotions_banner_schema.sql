-- ehemehe.lk Ad Promotions + Banner Ads schema
create extension if not exists pgcrypto;

create table if not exists public.ad_promotions (
  id text primary key,
  ad_id text not null,
  static_id text null,
  promotion_type text not null default 'top',
  category_id text null,
  days integer not null default 7,
  start_at timestamptz not null default now(),
  end_at timestamptz null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.banner_ads (
  id text primary key,
  title text not null default 'Banner Ad',
  image_url text null,
  target_url text null,
  placement text not null default 'home_top',
  days integer not null default 7,
  start_at timestamptz not null default now(),
  end_at timestamptz null,
  status text not null default 'active',
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.banner_ads add column if not exists days integer not null default 7;
alter table public.banner_ads add column if not exists start_at timestamptz not null default now();
alter table public.banner_ads add column if not exists end_at timestamptz null;
alter table public.banner_ads add column if not exists is_enabled boolean not null default true;
alter table public.banner_ads add column if not exists status text not null default 'active';
