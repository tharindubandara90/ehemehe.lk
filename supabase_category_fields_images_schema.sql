-- ehemehe.lk category fields and image upload helper
-- Run in Supabase SQL Editor after main schema.

alter table if exists public.ads
  add column if not exists custom_fields jsonb null;

alter table if exists public.ads
  add column if not exists images jsonb null;

alter table if exists public.ads
  add column if not exists vehicle_brand text null;

alter table if exists public.ads
  add column if not exists vehicle_model text null;

alter table if exists public.ads
  add column if not exists mileage_km numeric null;

alter table if exists public.ads
  add column if not exists fuel_type text null;

alter table if exists public.ads
  add column if not exists transmission text null;

alter table if exists public.ads
  add column if not exists year_manufacture integer null;

alter table if exists public.ads
  add column if not exists year_registered integer null;
