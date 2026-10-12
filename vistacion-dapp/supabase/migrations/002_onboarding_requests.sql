create table if not exists public.onboarding_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  contact_name text not null check (char_length(contact_name) between 1 and 120),
  contact_email text not null check (char_length(contact_email) between 3 and 200),
  organisation text check (char_length(organisation) <= 200),
  buyer text check (char_length(buyer) <= 200),
  seller text check (char_length(seller) <= 200),
  amount text check (char_length(amount) <= 60),
  asset_type text check (char_length(asset_type) <= 120),
  reference text check (char_length(reference) <= 120),
  expected_delivery text check (char_length(expected_delivery) <= 40),
  notes text check (char_length(notes) <= 2000),
  consent boolean not null check (consent),
  status text not null default 'new' check (status in ('new', 'contacted', 'closed'))
);

alter table public.onboarding_requests enable row level security;

revoke all on public.onboarding_requests from anon, authenticated;
grant insert (contact_name, contact_email, organisation, buyer, seller, amount, asset_type, reference, expected_delivery, notes, consent)
  on public.onboarding_requests to anon, authenticated;
grant select, update, delete on public.onboarding_requests to authenticated;

drop policy if exists "Anyone can submit an onboarding request" on public.onboarding_requests;
create policy "Anyone can submit an onboarding request"
  on public.onboarding_requests for insert to anon, authenticated
  with check (status = 'new');

drop policy if exists "Staff can read onboarding requests" on public.onboarding_requests;
create policy "Staff can read onboarding requests"
  on public.onboarding_requests for select to authenticated
  using ((select public.is_vistacoin_staff()));

drop policy if exists "Staff can update onboarding requests" on public.onboarding_requests;
create policy "Staff can update onboarding requests"
  on public.onboarding_requests for update to authenticated
  using ((select public.is_vistacoin_staff()))
  with check ((select public.is_vistacoin_staff()));

drop policy if exists "Admins can delete onboarding requests" on public.onboarding_requests;
create policy "Admins can delete onboarding requests"
  on public.onboarding_requests for delete to authenticated
  using ((select public.is_vistacoin_admin()));