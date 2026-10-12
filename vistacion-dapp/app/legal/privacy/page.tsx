import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Notice | Vistacoin" };

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Notice</h1>
      <p>Last updated: [DATE]. Data controller: Aerovista Club, 33 Fairhills, Irlam, Manchester, M44 6BA. Contact for privacy matters: marcelle@aerovistaclub.co.uk. ICO registration number: [NUMBER — confirm whether registration is required]. This notice is written for UK GDPR and the Data Protection Act 2018.</p>

      <h2>1. What we collect</h2>
      <ul>
        <li><strong>Customer records</strong> entered by staff: name, organisation, email, phone, country, notes, status, and details of the enquiry or proposed transaction.</li>
        <li><strong>Staff account data</strong>: email address, authentication and access-log data, role.</li>
        <li><strong>Technical data</strong>: IP address, browser/device data and security logs held by our hosting provider.</li>
        <li><strong>Blockchain data</strong>: wallet addresses and transactions on public networks are public and cannot be erased by us.</li>
      </ul>
      <p>We do not use the demo to collect customer personal data. We do not intentionally collect special-category data; please do not provide it.</p>

      <h2>2. Why we use it and our lawful basis</h2>
      <ul>
        <li>Responding to enquiries and preparing or performing a contract with you — <em>contract / steps before a contract</em>.</li>
        <li>Managing customers, fee records and accounts — <em>legitimate interests</em> (running our business) and <em>legal obligation</em> (accounting and tax).</li>
        <li>Identity, anti-money-laundering and sanctions checks if a live service is offered — <em>legal obligation</em>.</li>
        <li>Securing the service and preventing fraud — <em>legitimate interests</em>.</li>
      </ul>

      <h2>3. Who receives it</h2>
      <p>Staff approved by the administrator; and processors acting on our instructions, currently Supabase (database and authentication) and Vercel (hosting). We may also share data with professional advisers, regulators, law enforcement or as required by law. We do not sell personal data.</p>

      <h2>4. International transfers</h2>
      <p>Our providers may process data outside the UK. Where they do, we rely on adequacy regulations, the UK International Data Transfer Agreement/Addendum or equivalent safeguards. [CONFIRM hosting region and provider terms.]</p>

      <h2>5. Retention</h2>
      <p>Customer records are kept while the relationship is active and for [PERIOD — e.g. 6 years after the last transaction] for legal, tax and dispute purposes, then deleted or anonymised. Enquiries that do not proceed are deleted after [PERIOD].</p>

      <h2>6. Security</h2>
      <p>Customer data is held behind staff login with row-level access controls, so only authorised staff can read or change it. Access is limited to what is needed, administrators can revoke it, and incidents are handled under our <a href="/legal/data-breach">Data Breach Policy</a>. No system is completely secure.</p>

      <h2>7. Your rights</h2>
      <p>You may request access, correction, erasure, restriction, portability, and object to processing based on legitimate interests. Contact marcelle@aerovistaclub.co.uk. We will respond within one month. You may complain to the Information Commissioner&rsquo;s Office (ico.org.uk, 0303 123 1113) — we ask that you contact us first.</p>

      <h2>8. Cookies</h2>
      <p>We use only essential cookies needed for staff sign-in sessions. We do not use advertising or analytics cookies. [Update if this changes.]</p>

      <h2>9. Changes</h2>
      <p>We will publish updates here with a new date.</p>
    </>
  );
}