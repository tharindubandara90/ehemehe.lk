-- ehemehe.lk real Post Ad persistence
-- Safe to run more than once in Supabase SQL Editor.

alter table if exists public.ads
  add column if not exists user_id uuid null references auth.users(id) on delete set null;

alter table if exists public.ads
  add column if not exists custom_fields jsonb null;

alter table if exists public.ads
  add column if not exists images jsonb null;

create index if not exists ads_user_id_created_at_idx
  on public.ads (user_id, created_at desc);

create index if not exists ads_custom_fields_owner_idx
  on public.ads using gin (custom_fields);
