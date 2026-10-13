import Link from "next/link";
import { isSupabaseConfigured } from "@/src/lib/supabase/config";
import StaffLoginForm from "./staff-login-form";

export const metadata = {
  title: "Staff sign in",
  robots: { index: false, follow: false },
};

function SetupInstructions() {
  return (
    <section className="setup-card">
      <span className="readiness-state">CUSTOMER DATA IS NOT YET CONNECTED</span>
      <h2>Finish setting up the private customer workspace</h2>
      <p>The CRM is designed for invited staff only. Configure Supabase before adding any real customer information.</p>
      <ol>
        <li>Create a Supabase project and run <code>supabase/migrations/001_customer_management.sql</code> in its SQL Editor.</li>
        <li>Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your local app and Vercel environment.</li>
        <li>Invite your staff login in Supabase Authentication, then grant that user access using the setup guide in the app README.</li>
      </ol>
      <p>Never place a Supabase service-role key in the website or its public environment variables.</p>
    </section>
  );
}

export default function StaffLoginPage() {
  const configured = isSupabaseConfigured();

  return (
    <main className="site-shell staff-shell">
      <header className="site-header">
        <Link href="/" className="site-brand" aria-label="Vistacoin home">
          <span className="brand-mark">V</span>
          <span className="site-brand-name"><strong>VISTA</strong>COIN</span>
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          <a className="aerovista-button" href="https://fly-aerovista.emergent.host" target="_blank" rel="noopener noreferrer">AeroVista Club <span aria-hidden="true">↗</span></a>
          <Link href="/">Home</Link>
          <Link href="/demo">Demo</Link>
        </nav>
      </header>
      <section className="staff-heading">
        <p className="landing-kicker">PRIVATE STAFF AREA</p>
        <h1>Customer management</h1>
        <p>Customer records are available only to staff accounts that an administrator has explicitly approved.</p>
      </section>
      {configured ? <StaffLoginForm /> : <SetupInstructions />}
      <footer className="site-footer">
        <span>PRIVATE CUSTOMER WORKSPACE</span>
        <span>Access is protected by Supabase authentication and database row-level security.</span>
        <Link href="/">Back to Vistacoin</Link>
        <span className="legal-links"><Link href="/legal/terms">Terms</Link><Link href="/legal/privacy">Privacy</Link><Link href="/legal/data-breach">Data breach policy</Link></span>
      </footer>
    </main>
  );
}
