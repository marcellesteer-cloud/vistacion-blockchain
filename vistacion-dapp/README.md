# Vistacoin — Secure Global Trade

Next.js site with a public escrow **demo**, a private staff **customer workspace**, and the Sepolia testnet token dashboard.

## Status

- **Demo (`/demo`)**: fictional escrow walkthrough, no wallet or real data. Shows an illustrative 5% fee deducted from seller proceeds.
- **Live mode (`/demo` toggle)**: only an onboarding-request form that lands in the staff workspace; no wallet, contract or funds.
- **Live escrow**: NOT enabled. The deployed escrow contract is a Sepolia testnet contract (single-oracle, unaudited, no fee mechanism). Real-money escrow and fee collection need legal/regulatory review, a reviewed contract and an audit first.
- **Token dashboard (`/dashboard`)**, `/staking`, `/escrow`, `/governance`, `/ico`: Sepolia testnet only.
- **Legal (`/legal/*`)**: DRAFT terms, privacy notice and data-breach policy. A UK solicitor must review them and the `[PLACEHOLDERS]` must be completed.

## Customer workspace setup

1. Create a Supabase project and run `supabase/migrations/001_customer_management.sql`, then `002_onboarding_requests.sql`, in the SQL Editor.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.example`) locally and in Vercel. Never use the service-role key in the frontend.
3. In Supabase Authentication, create your user (disable public sign-ups).
4. Make yourself admin in the SQL Editor:

   ```sql
   insert into public.staff_members (user_id, role)
   select id, 'admin' from auth.users where email = 'YOUR_EMAIL';
   ```

5. Sign in at `/staff/login`. Admins can grant and revoke staff access from `/staff/customers`.

## Development

```bash
npm install
npm run dev
npm run lint
npm run build
```