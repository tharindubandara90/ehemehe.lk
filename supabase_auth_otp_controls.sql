-- ehemehe.lk unified Email + SMS OTP controls
-- Run this file in Supabase SQL Editor once.

create table if not exists public.site_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (key,value,updated_at) values
  ('email_otp_enabled','true',now()),
  ('email_otp_register_enabled','true',now()),
  ('email_otp_password_reset_enabled','true',now()),
  ('sms_otp_enabled','true',now()),
  ('sms_otp_register_enabled','true',now()),
  ('sms_otp_password_change_enabled','true',now()),
  ('sms_otp_ad_phone_enabled','true',now())
on conflict (key) do nothing;

alter table if exists public.profiles add column if not exists email_verified boolean not null default false;
alter table if exists public.profiles add column if not exists phone_verified_at timestamptz;
alter table if exists public.profiles add column if not exists registration_method text;

-- Safe public read access is limited to non-secret OTP enable/disable flags.
alter table public.site_settings enable row level security;
drop policy if exists "public read otp feature flags" on public.site_settings;
create policy "public read otp feature flags" on public.site_settings
for select using (key in (
  'email_otp_enabled','email_otp_register_enabled','email_otp_password_reset_enabled',
  'sms_otp_enabled','sms_otp_register_enabled','sms_otp_password_change_enabled','sms_otp_ad_phone_enabled',
  'otp_expiry_minutes'
));
