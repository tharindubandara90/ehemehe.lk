-- EheMehe.lk marketplace core database schema
-- Safe to run more than once in Supabase SQL Editor.
-- Creates the missing ads table, preserves existing data, adds required columns,
-- relationships, indexes, RLS policies and refreshes the PostgREST schema cache.

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Lookup tables. Existing tables are preserved.
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  parent_id uuid null references public.categories(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.categories add column if not exists name text;
alter table public.categories add column if not exists slug text;
alter table public.categories add column if not exists is_active boolean not null default true;
alter table public.categories add column if not exists created_at timestamptz not null default now();
alter table public.categories add column if not exists updated_at timestamptz not null default now();

do $$
declare
  id_type text;
begin
  if not exists (
    select 1 from pg_attribute
    where attrelid = 'public.categories'::regclass
      and attname = 'parent_id' and not attisdropped
  ) then
    select format_type(atttypid, atttypmod) into id_type
    from pg_attribute
    where attrelid = 'public.categories'::regclass
      and attname = 'id' and not attisdropped;
    execute format('alter table public.categories add column parent_id %s null', id_type);
  end if;
end $$;

create table if not exists public.districts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.districts add column if not exists name text;
alter table public.districts add column if not exists slug text;
alter table public.districts add column if not exists is_active boolean not null default true;
alter table public.districts add column if not exists created_at timestamptz not null default now();
alter table public.districts add column if not exists updated_at timestamptz not null default now();

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text null,
  district_id uuid null references public.districts(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cities add column if not exists name text;
alter table public.cities add column if not exists slug text;
alter table public.cities add column if not exists is_active boolean not null default true;
alter table public.cities add column if not exists created_at timestamptz not null default now();
alter table public.cities add column if not exists updated_at timestamptz not null default now();

do $$
declare
  id_type text;
begin
  if not exists (
    select 1 from pg_attribute
    where attrelid = 'public.cities'::regclass
      and attname = 'district_id' and not attisdropped
  ) then
    select format_type(atttypid, atttypmod) into id_type
    from pg_attribute
    where attrelid = 'public.districts'::regclass
      and attname = 'id' and not attisdropped;
    execute format('alter table public.cities add column district_id %s null', id_type);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Ads table. This was missing from the previous migration.
-- ---------------------------------------------------------------------------
create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  title text not null default '',
  description text null,
  price numeric null,
  currency text not null default 'LKR',
  phone text null,
  phone_verified boolean not null default false,
  phone_verified_at timestamptz null,
  condition text null,
  status text not null default 'pending',
  reject_reason text null,
  image_url text null,
  images jsonb not null default '[]'::jsonb,
  custom_fields jsonb not null default '{}'::jsonb,
  is_featured boolean not null default false,
  is_promoted boolean not null default false,
  promotion_type text null,
  view_count integer not null default 0,
  finance_enabled boolean not null default false,
  finance_downpayment numeric null,
  finance_monthly_payment numeric null,
  finance_downpayment_percent numeric null,
  finance_annual_rate_percent numeric null,
  finance_months integer null,
  finance_company_phone text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ads add column if not exists user_id uuid null references auth.users(id) on delete set null;
alter table public.ads add column if not exists title text;
alter table public.ads add column if not exists description text;
alter table public.ads add column if not exists price numeric;
alter table public.ads add column if not exists currency text not null default 'LKR';
alter table public.ads add column if not exists phone text;
alter table public.ads add column if not exists phone_verified boolean not null default false;
alter table public.ads add column if not exists phone_verified_at timestamptz;
alter table public.ads add column if not exists condition text;
alter table public.ads add column if not exists status text not null default 'pending';
alter table public.ads add column if not exists reject_reason text;
alter table public.ads add column if not exists image_url text;
alter table public.ads add column if not exists images jsonb not null default '[]'::jsonb;
alter table public.ads add column if not exists custom_fields jsonb not null default '{}'::jsonb;
alter table public.ads add column if not exists is_featured boolean not null default false;
alter table public.ads add column if not exists is_promoted boolean not null default false;
alter table public.ads add column if not exists promotion_type text;
alter table public.ads add column if not exists view_count integer not null default 0;
alter table public.ads add column if not exists finance_enabled boolean not null default false;
alter table public.ads add column if not exists finance_downpayment numeric;
alter table public.ads add column if not exists finance_monthly_payment numeric;
alter table public.ads add column if not exists finance_downpayment_percent numeric;
alter table public.ads add column if not exists finance_annual_rate_percent numeric;
alter table public.ads add column if not exists finance_months integer;
alter table public.ads add column if not exists finance_company_phone text;
alter table public.ads add column if not exists created_at timestamptz not null default now();
alter table public.ads add column if not exists updated_at timestamptz not null default now();

-- Match lookup foreign-key column types even when an existing project uses text IDs.
do $$
declare
  id_type text;
begin
  if not exists (
    select 1 from pg_attribute
    where attrelid = 'public.ads'::regclass
      and attname = 'category_id' and not attisdropped
  ) then
    select format_type(atttypid, atttypmod) into id_type
    from pg_attribute
    where attrelid = 'public.categories'::regclass
      and attname = 'id' and not attisdropped;
    execute format('alter table public.ads add column category_id %s null', id_type);
  end if;

  if not exists (
    select 1 from pg_attribute
    where attrelid = 'public.ads'::regclass
      and attname = 'city_id' and not attisdropped
  ) then
    select format_type(atttypid, atttypmod) into id_type
    from pg_attribute
    where attrelid = 'public.cities'::regclass
      and attname = 'id' and not attisdropped;
    execute format('alter table public.ads add column city_id %s null', id_type);
  end if;
end $$;

-- Add relationship metadata used by PostgREST embedded selects. NOT VALID keeps
-- this safe for projects that already contain older rows.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'categories_parent_id_fkey' and conrelid = 'public.categories'::regclass) then
    begin
      alter table public.categories
        add constraint categories_parent_id_fkey foreign key (parent_id)
        references public.categories(id) on delete set null not valid;
    exception when others then
      raise notice 'categories parent relationship was not added: %', sqlerrm;
    end;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'cities_district_id_fkey' and conrelid = 'public.cities'::regclass) then
    begin
      alter table public.cities
        add constraint cities_district_id_fkey foreign key (district_id)
        references public.districts(id) on delete set null not valid;
    exception when others then
      raise notice 'cities district relationship was not added: %', sqlerrm;
    end;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'ads_category_id_fkey' and conrelid = 'public.ads'::regclass) then
    begin
      alter table public.ads
        add constraint ads_category_id_fkey foreign key (category_id)
        references public.categories(id) on delete set null not valid;
    exception when others then
      raise notice 'ads category relationship was not added: %', sqlerrm;
    end;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'ads_city_id_fkey' and conrelid = 'public.ads'::regclass) then
    begin
      alter table public.ads
        add constraint ads_city_id_fkey foreign key (city_id)
        references public.cities(id) on delete set null not valid;
    exception when others then
      raise notice 'ads city relationship was not added: %', sqlerrm;
    end;
  end if;
end $$;

create index if not exists ads_status_created_at_idx on public.ads (status, created_at desc);
create index if not exists ads_user_id_created_at_idx on public.ads (user_id, created_at desc);
create index if not exists ads_category_id_created_at_idx on public.ads (category_id, created_at desc);
create index if not exists ads_city_id_created_at_idx on public.ads (city_id, created_at desc);
create index if not exists ads_custom_fields_gin_idx on public.ads using gin (custom_fields);
create index if not exists categories_slug_idx on public.categories (slug);
create index if not exists districts_slug_idx on public.districts (slug);
create index if not exists cities_district_id_name_idx on public.cities (district_id, name);

create or replace function public.ehemehe_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ehemehe_ads_updated_at on public.ads;
create trigger ehemehe_ads_updated_at
before update on public.ads
for each row execute function public.ehemehe_set_updated_at();

drop trigger if exists ehemehe_categories_updated_at on public.categories;
create trigger ehemehe_categories_updated_at
before update on public.categories
for each row execute function public.ehemehe_set_updated_at();

drop trigger if exists ehemehe_districts_updated_at on public.districts;
create trigger ehemehe_districts_updated_at
before update on public.districts
for each row execute function public.ehemehe_set_updated_at();

drop trigger if exists ehemehe_cities_updated_at on public.cities;
create trigger ehemehe_cities_updated_at
before update on public.cities
for each row execute function public.ehemehe_set_updated_at();

-- SECURITY DEFINER prevents recursive staff_permissions RLS checks.
create or replace function public.ehemehe_staff_has(permission_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  allowed boolean := false;
  jwt_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if jwt_email = 'ehemehe.lk@gmail.com' then
    return true;
  end if;

  if auth.uid() is null or to_regclass('public.staff_permissions') is null then
    return false;
  end if;

  execute $query$
    select exists (
      select 1
      from public.staff_permissions sp
      where sp.is_active = true
        and (sp.id = $1 or lower(sp.email) = $2)
        and case $3
          when 'can_view_ads' then coalesce(sp.can_view_ads, false)
          when 'can_approve_ads' then coalesce(sp.can_approve_ads, false)
          when 'can_edit_ads' then coalesce(sp.can_edit_ads, false)
          when 'can_delete_ads' then coalesce(sp.can_delete_ads, false)
          when 'can_manage_categories' then coalesce(sp.can_manage_categories, false)
          when 'can_manage_cities' then coalesce(sp.can_manage_cities, false)
          else lower(coalesce(sp.role, '')) = 'admin'
        end
    )
  $query$ into allowed using auth.uid(), jwt_email, permission_name;

  return coalesce(allowed, false);
exception
  when undefined_table or undefined_column then return false;
end;
$$;

revoke all on function public.ehemehe_staff_has(text) from public;
grant execute on function public.ehemehe_staff_has(text) to anon, authenticated, service_role;

alter table public.ads enable row level security;
alter table public.categories enable row level security;
alter table public.districts enable row level security;
alter table public.cities enable row level security;

-- Ads policies
drop policy if exists "ehemehe public read approved ads" on public.ads;
create policy "ehemehe public read approved ads"
on public.ads for select
to anon, authenticated
using (status = 'approved');

drop policy if exists "ehemehe owners read own ads" on public.ads;
create policy "ehemehe owners read own ads"
on public.ads for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "ehemehe staff read all ads" on public.ads;
create policy "ehemehe staff read all ads"
on public.ads for select
to authenticated
using (public.ehemehe_staff_has('can_view_ads'));

drop policy if exists "ehemehe owners create own ads" on public.ads;
create policy "ehemehe owners create own ads"
on public.ads for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "ehemehe staff create ads" on public.ads;
create policy "ehemehe staff create ads"
on public.ads for insert
to authenticated
with check (public.ehemehe_staff_has('can_edit_ads'));

drop policy if exists "ehemehe owners update pending ads" on public.ads;
create policy "ehemehe owners update pending ads"
on public.ads for update
to authenticated
using (user_id = auth.uid() and status in ('pending', 'rejected'))
with check (user_id = auth.uid());

drop policy if exists "ehemehe staff update ads" on public.ads;
create policy "ehemehe staff update ads"
on public.ads for update
to authenticated
using (
  public.ehemehe_staff_has('can_edit_ads')
  or public.ehemehe_staff_has('can_approve_ads')
)
with check (
  public.ehemehe_staff_has('can_edit_ads')
  or public.ehemehe_staff_has('can_approve_ads')
);

drop policy if exists "ehemehe staff delete ads" on public.ads;
create policy "ehemehe staff delete ads"
on public.ads for delete
to authenticated
using (public.ehemehe_staff_has('can_delete_ads'));

-- Lookup policies
drop policy if exists "ehemehe public read active categories" on public.categories;
create policy "ehemehe public read active categories"
on public.categories for select
to anon, authenticated
using (is_active = true);

drop policy if exists "ehemehe staff manage categories" on public.categories;
create policy "ehemehe staff manage categories"
on public.categories for all
to authenticated
using (public.ehemehe_staff_has('can_manage_categories'))
with check (public.ehemehe_staff_has('can_manage_categories'));

drop policy if exists "ehemehe public read active districts" on public.districts;
create policy "ehemehe public read active districts"
on public.districts for select
to anon, authenticated
using (is_active = true);

drop policy if exists "ehemehe staff manage districts" on public.districts;
create policy "ehemehe staff manage districts"
on public.districts for all
to authenticated
using (public.ehemehe_staff_has('can_manage_cities'))
with check (public.ehemehe_staff_has('can_manage_cities'));

drop policy if exists "ehemehe public read active cities" on public.cities;
create policy "ehemehe public read active cities"
on public.cities for select
to anon, authenticated
using (is_active = true);

drop policy if exists "ehemehe staff manage cities" on public.cities;
create policy "ehemehe staff manage cities"
on public.cities for all
to authenticated
using (public.ehemehe_staff_has('can_manage_cities'))
with check (public.ehemehe_staff_has('can_manage_cities'));

grant usage on schema public to anon, authenticated;
grant select on public.ads, public.categories, public.districts, public.cities to anon, authenticated;
grant insert, update, delete on public.ads to authenticated;
grant insert, update, delete on public.categories, public.districts, public.cities to authenticated;
grant all on public.ads, public.categories, public.districts, public.cities to service_role;

commit;

-- Ask PostgREST to immediately refresh table and relationship metadata.
notify pgrst, 'reload schema';

-- The SQL Editor result should show ads_table = public.ads.
select
  to_regclass('public.ads') as ads_table,
  to_regclass('public.categories') as categories_table,
  to_regclass('public.districts') as districts_table,
  to_regclass('public.cities') as cities_table;
