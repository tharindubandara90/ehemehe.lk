-- EheMehe.lk public interactions schema
-- Safe to run more than once. Does not delete existing reports.

begin;
create extension if not exists pgcrypto;

create table if not exists public.ad_reports (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid null,
  reporter_email text null,
  reason text not null,
  message text null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ad_reports add column if not exists ad_id uuid null;
alter table public.ad_reports add column if not exists reporter_email text null;
alter table public.ad_reports add column if not exists reason text null;
alter table public.ad_reports add column if not exists message text null;
alter table public.ad_reports add column if not exists status text not null default 'pending';
alter table public.ad_reports add column if not exists created_at timestamptz not null default now();
alter table public.ad_reports add column if not exists updated_at timestamptz not null default now();

create index if not exists ad_reports_status_created_idx on public.ad_reports(status, created_at desc);
create index if not exists ad_reports_ad_id_idx on public.ad_reports(ad_id);

create or replace function public.ehemehe_can_review_reports()
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  allowed boolean := false;
begin
  if lower(coalesce(auth.jwt() ->> 'email', '')) = 'ehemehe.lk@gmail.com' then
    return true;
  end if;

  if to_regprocedure('public.ehemehe_staff_has(text)') is not null then
    execute 'select public.ehemehe_staff_has($1)' into allowed using 'can_view_ads';
    return coalesce(allowed, false);
  end if;

  return false;
exception when others then
  return false;
end;
$$;

revoke all on function public.ehemehe_can_review_reports() from public;
grant execute on function public.ehemehe_can_review_reports() to authenticated, service_role;

alter table public.ad_reports enable row level security;

drop policy if exists "ehemehe staff read reports" on public.ad_reports;
create policy "ehemehe staff read reports"
on public.ad_reports for select
to authenticated
using (public.ehemehe_can_review_reports());

drop policy if exists "ehemehe staff update reports" on public.ad_reports;
create policy "ehemehe staff update reports"
on public.ad_reports for update
to authenticated
using (public.ehemehe_can_review_reports())
with check (public.ehemehe_can_review_reports());

drop policy if exists "ehemehe staff delete reports" on public.ad_reports;
create policy "ehemehe staff delete reports"
on public.ad_reports for delete
to authenticated
using (public.ehemehe_can_review_reports());

grant usage on schema public to authenticated;
grant select, update, delete on public.ad_reports to authenticated;
grant all on public.ad_reports to service_role;

commit;
notify pgrst, 'reload schema';

select to_regclass('public.ad_reports') as ad_reports_table;
