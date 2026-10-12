create table if not exists public.staff_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

create table if not exists public.customer_records (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  company text check (company is null or char_length(company) <= 160),
  email text not null check (char_length(email) between 3 and 254),
  country text check (country is null or char_length(country) <= 80),
  sector text check (sector is null or char_length(sector) <= 100),
  status text not null default 'lead'
    check (status in ('lead', 'qualified', 'active', 'closed')),
  notes text check (notes is null or char_length(notes) <= 4000),
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_records_updated_at_idx
  on public.customer_records (updated_at desc);
create index if not exists customer_records_email_idx
  on public.customer_records (lower(email));

create or replace function public.is_vistacoin_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_members
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_vistacoin_staff() from public;
grant execute on function public.is_vistacoin_staff() to authenticated;

create or replace function public.is_vistacoin_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_members
    where user_id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function public.is_vistacoin_admin() from public;
grant execute on function public.is_vistacoin_admin() to authenticated;

create or replace function public.set_customer_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_customer_records_updated_at on public.customer_records;
create trigger set_customer_records_updated_at
  before update on public.customer_records
  for each row execute function public.set_customer_updated_at();

alter table public.staff_members enable row level security;
alter table public.customer_records enable row level security;

revoke all on public.staff_members from anon, authenticated;
grant select, insert, delete on public.staff_members to authenticated;
revoke all on public.customer_records from anon;
grant select, insert, update, delete on public.customer_records to authenticated;

drop policy if exists "Staff can read their own membership" on public.staff_members;
create policy "Staff can read their own membership"
  on public.staff_members for select to authenticated
  using ((select auth.uid()) = user_id or (select public.is_vistacoin_admin()));

drop policy if exists "Admins can grant staff access" on public.staff_members;
create policy "Admins can grant staff access"
  on public.staff_members for insert to authenticated
  with check ((select public.is_vistacoin_admin()) and role = 'staff');

drop policy if exists "Admins can revoke staff access" on public.staff_members;
create policy "Admins can revoke staff access"
  on public.staff_members for delete to authenticated
  using (
    (select public.is_vistacoin_admin())
    and role = 'staff'
    and user_id <> (select auth.uid())
  );

drop policy if exists "Approved staff can read customer records" on public.customer_records;
create policy "Approved staff can read customer records"
  on public.customer_records for select to authenticated
  using ((select public.is_vistacoin_staff()));

drop policy if exists "Approved staff can add customer records" on public.customer_records;
create policy "Approved staff can add customer records"
  on public.customer_records for insert to authenticated
  with check (
    (select public.is_vistacoin_staff())
    and created_by = (select auth.uid())
  );

drop policy if exists "Approved staff can update customer records" on public.customer_records;
create policy "Approved staff can update customer records"
  on public.customer_records for update to authenticated
  using ((select public.is_vistacoin_staff()))
  with check ((select public.is_vistacoin_staff()));

drop policy if exists "Approved staff can delete customer records" on public.customer_records;
create policy "Approved staff can delete customer records"
  on public.customer_records for delete to authenticated
  using ((select public.is_vistacoin_staff()));
