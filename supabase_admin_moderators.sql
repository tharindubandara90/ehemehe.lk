
-- ehemehe.lk admin/moderator helper
-- Supabase SQL Editor එකේ run කරන්න.
-- Requirement: moderator email එක Supabase Authentication > Users වල already තියෙන්න ඕන.

create table if not exists public.staff_permissions (
  id uuid primary key references auth.users(id) on delete cascade,
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
  created_at timestamptz not null default now()
);

alter table public.staff_permissions enable row level security;

drop policy if exists "staff can read staff_permissions" on public.staff_permissions;
create policy "staff can read staff_permissions"
on public.staff_permissions for select
to authenticated
using (
  exists (
    select 1 from public.staff_permissions sp
    where sp.id = auth.uid() and sp.is_active = true
  )
);

drop policy if exists "admins can manage staff_permissions" on public.staff_permissions;
create policy "admins can manage staff_permissions"
on public.staff_permissions for all
to authenticated
using (
  exists (
    select 1 from public.staff_permissions sp
    where sp.id = auth.uid()
      and sp.is_active = true
      and (sp.role = 'admin' or sp.can_manage_moderators = true)
  )
)
with check (
  exists (
    select 1 from public.staff_permissions sp
    where sp.id = auth.uid()
      and sp.is_active = true
      and (sp.role = 'admin' or sp.can_manage_moderators = true)
  )
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
  -- Only admin / staff with manage moderators permission can call this
  if not exists (
    select 1 from public.staff_permissions sp
    where sp.id = auth.uid()
      and sp.is_active = true
      and (sp.role = 'admin' or sp.can_manage_moderators = true)
  ) then
    raise exception 'Not allowed to manage moderators';
  end if;

  select u.id into target_user_id
  from auth.users u
  where lower(u.email) = lower(staff_email)
  limit 1;

  if target_user_id is null then
    raise exception 'No Supabase Auth user found for %', staff_email;
  end if;

  insert into public.staff_permissions (
    id,email,role,
    can_view_users,can_approve_users,
    can_view_ads,can_approve_ads,can_edit_ads,can_delete_ads,
    can_manage_categories,can_manage_cities,can_manage_moderators,
    is_active
  )
  values (
    target_user_id, lower(staff_email), staff_role,
    p_can_view_users,p_can_approve_users,
    p_can_view_ads,p_can_approve_ads,p_can_edit_ads,p_can_delete_ads,
    p_can_manage_categories,p_can_manage_cities,p_can_manage_moderators,
    true
  )
  on conflict (id) do update set
    email = excluded.email,
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
    is_active = true;

  return 'Moderator saved';
end;
$$;

grant execute on function public.add_staff_by_email(
  text,text,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean
) to authenticated;
