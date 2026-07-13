-- Vehicle finance settings + optional ad finance columns
-- Run in Supabase SQL Editor.

create table if not exists public.site_settings (
  key text primary key,
  value text null,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (key, value, updated_at) values
  ('vehicle_downpayment_percent', '40', now()),
  ('vehicle_annual_rate_percent', '15', now()),
  ('vehicle_finance_months', '48', now()),
  ('vehicle_finance_company_phone', '+94 77 000 0000', now())
on conflict (key) do nothing;

alter table public.ads add column if not exists finance_enabled boolean default false;
alter table public.ads add column if not exists finance_downpayment numeric;
alter table public.ads add column if not exists finance_monthly_payment numeric;
alter table public.ads add column if not exists finance_downpayment_percent numeric;
alter table public.ads add column if not exists finance_annual_rate_percent numeric;
alter table public.ads add column if not exists finance_months integer;
alter table public.ads add column if not exists finance_company_phone text;
