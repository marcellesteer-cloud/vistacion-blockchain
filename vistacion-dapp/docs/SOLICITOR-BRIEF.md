# Vistacoin / Aerovista Club: Solicitor Review Brief

Prepared for legal review. **Nothing here is legal advice. The site must not take real money until a solicitor signs off.**

> **The platform must not accept custody of client funds, cryptoassets, bullion, aircraft deposits, mineral payments, or any transaction consideration until regulatory analysis has been completed and written legal sign-off obtained.**

## Operator
- Aerovista Club, 33 Fairhills, Irlam, Manchester M44 6BA
- marcelle@aerovistaclub.co.uk, 07749395963
- To confirm: legal form (company / sole trader / partnership), company number, ICO registration.

## What exists today
- Public site: https://project-xhavn.vercel.app (landing, `/demo`, `/legal/*`).
- Demo: fictional walkthrough, no wallet, no money.
- Live mode: an **onboarding request form only**. It stores contact details and deal intent in Supabase (hosting region to be confirmed). It does not hold, move or escrow any funds.
- Staff workspace (`/staff`): login-only CRM for the operator.
- Smart contracts: Sepolia testnet only; single oracle, unaudited, no fee logic. No mainnet deployment.
- The 5% fee (deducted from seller proceeds) is **illustrative only**; no fee is collected.

## Questions for the solicitor
1. **Regulatory perimeter (UK):** Does holding or releasing client funds or assets in escrow, charging a % fee, or using a token (VSC) require FCA authorisation or registration (payment services, e-money, cryptoasset registration under the MLRs, safeguarding, financial promotions)? Can a non-custodial or third-party escrow structure avoid this?
2. **AML/KYC:** Obligations as a business facilitating high-value transactions (bullion, minerals, aircraft, yachts). HMRC supervision, CDD, source of funds, sanctions/PEP screening, record keeping, MLRO.
3. **Fee:** Is a 5% fee on seller proceeds lawful and sufficiently disclosed? Consumer vs business customers; unfair terms.
4. **Terms & Conditions:** Review `/legal/terms`: scope of service, liability caps, governing law (England and Wales assumed), dispute process, token disclaimers, no investment advice.
5. **Privacy:** Review `/legal/privacy` against UK GDPR / DPA 2018: lawful bases, retention periods, processors (Supabase, Vercel), international transfers, ICO registration.
6. **Data breach:** Review `/legal/data-breach`: 72-hour ICO notification process, named breach lead, notifying affected people.
7. **Token (VSC):** Classification, promotion restrictions, any sale/ICO activity.
8. **Insurance and liability** for operating an escrow service.

## Placeholders to complete
`[DATE]`, `[CONFIRM ...]`, retention `[PERIOD]`, hosting region, governing law confirmation, ICO number, company number, solicitor-completed regulatory and liability sections.

## Technical go-live gates (not met)
- Contract audit; multi-party release, dispute handling, pause, admin controls, event logging.
- Mainnet deployment plan and key custody.
- KYC/AML tooling and sanctions screening before any live escrow.
- Fee-collection logic implemented, tested and audited, matching the approved Terms.

## Additional questions
9. **Financial promotions:** Do website content, token references, projected returns, staking rewards, referral programmes or investment-related statements constitute financial promotions under UK law?
10. **Consumers vs businesses:** Is the platform business-to-business only, or will consumers be permitted? Consumer law is substantially more restrictive.
11. **Jurisdictions:** Review the UK, DRC, Uganda, UAE (if future operations occur) and customer jurisdictions. Review cross-border enforceability of contracts and dispute resolution provisions.
12. **Insurance:** What professional indemnity, cyber liability, crime, D&O, escrow errors and omissions, and AML-related cover should be maintained?
13. **Bullion and minerals:** Enhanced AML duties: source of funds, sanctions, PEPs, suspicious activity reporting, record retention.
14. **Data protection implementation:** Retention schedule, subject access request procedure, lawful basis mapping, deletion procedure, and processor agreements (Supabase, Vercel, email providers).

## Lowest-risk operating model (recommended until sign-off)
- Onboarding and introductions platform only.
- No custody, no client money account, no token sales.
- Fees invoiced manually under solicitor-approved terms.
- KYC completed before introducing counterparties.
