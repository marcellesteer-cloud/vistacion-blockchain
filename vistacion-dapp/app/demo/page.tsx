import Link from "next/link";
import ModeSwitch from "./mode-switch";

export const metadata = {
  title: "Escrow Demo",
  description: "Try a fictional Vistacoin escrow walkthrough. No funds or wallet are used.",
};

export default function DemoPage() {
  return (
    <main className="site-shell staff-shell">
      <header className="site-header">
        <Link href="/" className="site-brand" aria-label="Vistacoin home">
          <span className="brand-mark">V</span>
          <span className="site-brand-name"><strong>VISTA</strong>COIN</span>
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          <Link href="/">Home</Link>
          <Link href="/dashboard">Token dashboard</Link>
          <Link href="/staff/login" className="site-nav-login">Staff sign in</Link>
        </nav>
      </header>
      <section className="staff-heading">
        <p className="landing-kicker">INTERACTIVE WALKTHROUGH · FICTIONAL DATA</p>
        <h1>See how an escrow could work.</h1>
        <p>This guided demo runs only in your browser. It does not connect a wallet, create an on-chain deal, or move money.</p>
      </section>
      <div className="readiness-banner" role="note">
        <span className="readiness-icon" aria-hidden="true">!</span>
        <p><strong>Demo mode.</strong> All people, amounts, and statuses below are examples, not real offers or transactions.</p>
        <span className="readiness-state">NO FUNDS AT RISK</span>
      </div>
      <ModeSwitch />
      <div className="demo-footer-links">
        <Link href="/" className="text-gold-link">← Back to Vistacoin</Link>
        <Link href="/escrow" className="text-gold-link">Sepolia testnet contract interface <span aria-hidden="true">↗</span></Link>
      </div>
      <footer className="site-footer">
        <span>VISTACOIN · DEMO ONLY</span>
        <span>Real-money escrow is not enabled.</span>
        <span className="legal-links"><Link href="/legal/terms">Terms</Link><Link href="/legal/privacy">Privacy</Link><Link href="/legal/data-breach">Data breach policy</Link></span>
      </footer>
    </main>
  );
}
