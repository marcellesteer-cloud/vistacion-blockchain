import type { Metadata } from "next";

export const metadata: Metadata = { title: "Data Breach Policy | Vistacoin" };

export default function DataBreachPage() {
  return (
    <>
      <h1>Data Breach Policy</h1>
      <p>Last updated: [DATE]. Applies to all administrators, staff and contractors with access to Vistacoin customer data. Breach lead: [NAME / ROLE, EMAIL, PHONE].</p>

      <h2>1. What is a personal data breach</h2>
      <p>Any security incident leading to accidental or unlawful destruction, loss, alteration, unauthorised disclosure of, or access to, personal data. Examples: a stolen or shared password, a lost laptop with an active session, data emailed to the wrong person, a misconfigured database policy, or a compromised provider account.</p>

      <h2>2. Everyone&rsquo;s duty: report immediately</h2>
      <p>Anyone who suspects a breach must tell the breach lead at once, and in any case within hours, not days. Do not try to hide, investigate alone, or delete evidence. Staff will not be penalised for good-faith reporting.</p>

      <h2>3. Response steps</h2>
      <ol>
        <li><strong>Contain.</strong> Revoke the affected staff access (admin console), reset passwords, sign out sessions, rotate keys, and disable affected features.</li>
        <li><strong>Assess.</strong> Record what happened, when it was found, which data and people are affected, and the likely risk to them.</li>
        <li><strong>Record.</strong> Log every breach, including those not reported, with facts, effects and actions taken.</li>
        <li><strong>Notify the ICO</strong> without undue delay and within <strong>72 hours</strong> of becoming aware, unless the breach is unlikely to result in a risk to individuals. If full details are not yet known, report in phases.</li>
        <li><strong>Notify affected individuals</strong> without undue delay where the breach is likely to result in a <strong>high risk</strong> to them, saying in plain language what happened, likely consequences, what we are doing, and how they can protect themselves.</li>
        <li><strong>Notify others</strong> where appropriate: our processors, insurers, banks, the police/Action Fraud, and any regulator that applies to a live service.</li>
        <li><strong>Review.</strong> Fix the root cause, update controls and training, and note lessons learned.</li>
      </ol>

      <h2>4. Processors</h2>
      <p>If a processor (such as Supabase or Vercel) suffers a breach affecting our data, we expect prompt notice and will start this process when we become aware.</p>

      <h2>5. Preventive controls</h2>
      <ul>
        <li>Invitation-only accounts with unique strong passwords; multi-factor authentication to be enabled for all staff [CONFIRM].</li>
        <li>Least-privilege access, with administrators reviewing and revoking staff access regularly.</li>
        <li>Row-level security on all customer tables; the database service-role key is never used in the website or shared.</li>
        <li>No customer data in emails, chat or personal devices unless approved.</li>
      </ul>

      <h2>6. Contacts</h2>
      <p>Breach lead: [NAME, EMAIL, PHONE]. ICO: ico.org.uk/make-a-complaint/data-protection-complaints/ or 0303 123 1113.</p>
    </>
  );
}