-- EheMehe.lk: 25-day ad lifetime and template/demo cleanup
-- Run once in Supabase SQL Editor after deploying this project.

alter table public.ads
  add column if not exists expires_at timestamptz default (now() + interval '25 days');

update public.ads
set expires_at = coalesce(created_at, now()) + interval '25 days'
where expires_at is null;

alter table public.ads alter column expires_at set default (now() + interval '25 days');
alter table public.ads alter column expires_at set not null;
create index if not exists ads_expires_at_idx on public.ads (expires_at);

do $$
declare
  demo_titles text[] := array[
    '2020 toyota prius hybrid - low mileage',
    'modern 3-bedroom house in kandy',
    'iphone 15 pro max 256gb - space black',
    'samsung 65" qled 4k smart tv',
    'professional guitar - fender stratocaster',
    'honda cb150r - excellent condition',
    'macbook pro m3 14-inch 16gb/512gb',
    'golden retriever puppies - 3 months',
    'modern sofa set - 7 piece',
    'software engineer - remote position',
    'land for sale - 10 perches in kadawatha',
    'professional photography services',
    'nike air max 270 - white/black',
    'three wheeler - bajaj re 205',
    'a-level physics tuition - online',
    'industrial sewing machine - juki',
    'used laptop - core i5, 8gb ram'
  ];
begin
  if to_regclass('public.ad_promotions') is not null then
    begin
      delete from public.ad_promotions p
      using public.ads a
      where p.ad_id::text = a.id::text
        and lower(trim(a.title)) = any(demo_titles);
    exception when undefined_column then null;
    end;
  end if;

  if to_regclass('public.ad_reports') is not null then
    begin
      delete from public.ad_reports r
      using public.ads a
      where r.ad_id::text = a.id::text
        and lower(trim(a.title)) = any(demo_titles);
    exception when undefined_column then null;
    end;
  end if;

  delete from public.ads
  where lower(trim(title)) = any(demo_titles)
     or lower(coalesce(custom_fields ->> 'is_demo', 'false')) = 'true'
     or lower(coalesce(custom_fields ->> 'demo', 'false')) = 'true'
     or lower(coalesce(custom_fields ->> 'sample', 'false')) = 'true';
end $$;
