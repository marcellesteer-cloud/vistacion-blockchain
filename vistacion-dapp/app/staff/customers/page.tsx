import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { isSupabaseConfigured } from "@/src/lib/supabase/config";
import CustomerManager from "./customer-manager";
import SignOutButton from "./sign-out-button";
import StaffAccessManager from "./staff-access-manager";

export const metadata = {
  title: "Customer workspace",
  robots: { index: false, follow: false },
};

export default async function StaffCustomersPage() {
  if (!isSupabaseConfigured()) redirect("/staff/login");

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(`Staff authentication could not be verified: ${authError.message}`);
  if (!user) redirect("/staff/login");

  const { data: membership, error: membershipError } = await supabase
    .from("staff_members")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    return (
      <main className="site-shell staff-shell">
        <p className="form-error" role="alert">Staff access could not be checked: {membershipError.message}</p>
        <Link href="/staff/login" className="text-gold-link">Return to sign in</Link>
      </main>
    );
  }

  if (!membership) {
    return (
      <main className="site-shell staff-shell">
        <header className="site-header">
          <Link href="/" className="site-brand" aria-label="Vistacoin home">
            <span className="brand-mark">V</span>
            <span className="site-brand-name"><strong>VISTA</strong>COIN</span>
          </Link>
          <SignOutButton />
        </header>
        <section className="setup-card access-denied">
          <span className="readiness-state">ACCESS NOT APPROVED</span>
          <h1>This account is not on the staff access list.</h1>
          <p>Ask a workspace administrator to approve your account. No customer records were loaded.</p>
          <Link href="/" className="text-gold-link">Back to Vistacoin</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="site-shell staff-shell">
      <header className="site-header">
        <Link href="/" className="site-brand" aria-label="Vistacoin home">
          <span className="brand-mark">V</span>
          <span className="site-brand-name"><strong>VISTA</strong>COIN</span>
        </Link>
        <div className="staff-header-user">
          <span>{user.email ?? "Approved staff"} · {membership.role}</span>
          <SignOutButton />
        </div>
      </header>
      <section className="staff-heading">
        <p className="landing-kicker">PRIVATE STAFF WORKSPACE · LIVE CUSTOMER RECORDS</p>
        <h1>Customer management</h1>
        <p>Add and maintain customer contact details, business information, notes, and relationship status.</p>
      </section>
      <div className="readiness-banner" role="note">
        <span className="readiness-icon" aria-hidden="true">i</span>
        <p><strong>Customer workspace only.</strong> This login does not enable real-money escrow or authorize customer funds.</p>
        <span className="readiness-state">STAFF ACCESS VERIFIED</span>
      </div>
      {membership.role === "admin" && <StaffAccessManager />}
      <CustomerManager />
    </main>
  );
}
