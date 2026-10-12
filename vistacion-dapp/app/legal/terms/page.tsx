import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms & Conditions | Vistacoin" };

export default function TermsPage() {
  return (
    <>
      <h1>Terms &amp; Conditions</h1>
      <p>Last updated: [DATE]. Operator: Aerovista Club, company number [NUMBER], registered office [ADDRESS] (&ldquo;we&rdquo;, &ldquo;us&rdquo;). Contact: [EMAIL].</p>

      <h2>1. About this service</h2>
      <p>Vistacoin provides (a) a demonstration of an escrow workflow using fictional data, (b) a testnet token and smart-contract interface on the Ethereum Sepolia test network, and (c) a private customer-management workspace for authorised staff. By using the site you agree to these terms.</p>

      <h2>2. Current status: demonstration only</h2>
      <ul>
        <li>The escrow demo uses fictional parties, assets and amounts. Nothing in it is an offer, quotation, or contract.</li>
        <li>Live escrow of real money, tokens with real value, or goods is <strong>not currently available</strong>. Do not send real funds to any address shown on this site.</li>
        <li>Sepolia tokens and contracts have no monetary value, are unaudited, and may be reset or stop working at any time.</li>
        <li>We will only offer a live service after the necessary legal, regulatory, security and audit work is complete, and we will update these terms before then.</li>
      </ul>

      <h2>3. Fees</h2>
      <p>When a live service becomes available, our fee is intended to be <strong>5% of the transaction amount, deducted from the seller&rsquo;s proceeds</strong>, unless a different fee is agreed in writing before the transaction. Any fee shown in the demo is illustrative only and nothing is charged or collected now. VAT and third-party charges (including blockchain network fees and any token transfer burn) may apply in addition and will be disclosed before you commit.</p>

      <h2>4. Regulatory position</h2>
      <p>[SOLICITOR TO COMPLETE: confirm whether the intended live service requires authorisation or registration (for example under the Money Laundering Regulations, FCA cryptoasset registration or payment services rules) and state the position here.] Until confirmed, no live regulated activity is carried out. Customers may be required to complete identity, source-of-funds and sanctions checks before any live transaction.</p>

      <h2>5. Not advice</h2>
      <p>Nothing on this site is financial, investment, legal, tax or trading advice. Vistacoin tokens are not an investment, are not offered to the public as such, and may lose all value. Obtain independent advice before relying on anything here.</p>

      <h2>6. Customer and staff accounts</h2>
      <ul>
        <li>Access to the customer workspace is by invitation only. Staff must keep credentials secret, use a unique strong password, and not share accounts.</li>
        <li>The administrator may grant or revoke staff access at any time. Staff may use customer data only for approved business purposes and in line with our Privacy Notice and Data Breach Policy.</li>
        <li>Suspected unauthorised access or data loss must be reported immediately as set out in the Data Breach Policy.</li>
      </ul>

      <h2>7. Acceptable use</h2>
      <p>You must not use the site for unlawful activity, money laundering, sanctions evasion, fraud, attempts to disrupt or gain unauthorised access to the service, or to submit data you have no right to submit.</p>

      <h2>8. Intellectual property</h2>
      <p>The site, branding and content belong to us or our licensors. You may view the site for your own lawful use but may not copy or reuse it commercially without permission.</p>

      <h2>9. Third-party services</h2>
      <p>The site relies on third parties including hosting (Vercel), database and authentication (Supabase), and public blockchain networks and wallets. We are not responsible for their availability or acts.</p>

      <h2>10. Liability</h2>
      <p>Nothing limits liability for death or personal injury caused by negligence, fraud or fraudulent misrepresentation, or anything that cannot lawfully be limited. Subject to that, the demo and testnet features are provided &ldquo;as is&rdquo; without warranties, and we are not liable for loss arising from their use or from reliance on them. [SOLICITOR TO CONFIRM overall liability cap and consumer/business distinctions.]</p>

      <h2>11. Changes and termination</h2>
      <p>We may change the site or these terms and may suspend or end access at any time. Material changes will be published here with a new date.</p>

      <h2>12. Governing law</h2>
      <p>These terms are governed by the laws of [England and Wales — CONFIRM], and the courts of [England and Wales — CONFIRM] have jurisdiction, without affecting any mandatory consumer rights.</p>

      <h2>13. Contact</h2>
      <p>[EMAIL] · [POSTAL ADDRESS]</p>
    </>
  );
}