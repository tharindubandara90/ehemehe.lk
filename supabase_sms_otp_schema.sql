-- ehemehe.lk SMS OTP helper schema
-- Run in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.sms_otp_logs (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  purpose text not null,
  provider text not null default 'textlk',
  status text not null default 'sent',
  expires_at timestamptz null,
  verified_at timestamptz null,
  created_at timestamptz not null default now()
);

alter table if exists public.ads
  add column if not exists phone_verified boolean not null default false;

alter table if exists public.ads
  add column if not exists phone_verified_at timestamptz null;

alter table if exists public.profiles
  add column if not exists phone text null;

alter table if exists public.profiles
  add column if not exists phone_verified boolean not null default false;

insert into public.site_settings (key, value, updated_at) values
  ('sms_provider', 'Text.lk', now()),
  ('sms_sender', 'EHEMEHE', now()),
  ('otp_expiry_minutes', '5', now()),
  ('otp_sms_template', 'Your ehemehe.lk verification code is {{code}}. Do not share this code.', now())
on conflict (key) do update set
  value = excluded.value,
  updated_at = now();
