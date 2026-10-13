import Link from "next/link";

export default function Home() {
  return (
    <main className="site-shell">
      <header className="site-header">
        <Link href="/" className="site-brand" aria-label="Vistacoin home">
          <span className="brand-mark">V</span>
          <span className="site-brand-name"><strong>VISTA</strong>COIN</span>
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          <a className="aerovista-button" href="https://fly-aerovista.emergent.host" target="_blank" rel="noopener noreferrer">AeroVista Club <span aria-hidden="true">↗</span></a>
          <Link href="/demo">Demo</Link>
          <Link href="/dashboard">Token dashboard</Link>
          <Link href="/staff/login" className="site-nav-login">Customer management <span aria-hidden="true">↗</span></Link>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="landing-copy">
          <p className="landing-kicker">A BRIGHTER TOMORROW TOGETHER</p>
          <h1>Secure Global Trade.<br /><span>Trusted Escrow Protection.</span></h1>
          <p className="landing-lede">
            High-value transactions require more than trust. They require
            security, transparency, and a carefully managed process.
          </p>
          <p className="landing-body">
            From bullion and mineral transactions to aircraft sales and
            international commodity deals, Vistacoin is developing an escrow
            experience designed to help buyers and sellers manage each step.
          </p>
          <div className="landing-actions">
            <Link className="gold-button" href="/demo">Explore the demo <span aria-hidden="true">↗</span></Link>
            <Link className="outline-button" href="/staff/login">Staff customer login</Link>
          </div>
        </div>
        <div className="landing-art" role="img" aria-label="Vistacoin emblem and secure trade illustration">
          <div className="art-glow" />
          <div className="art-coin">
            <div className="art-coin-ring">
              <span className="coin-topline">PEOPLE · PROGRESS · POSSIBILITY</span>
              <div className="coin-mountain"><span /></div>
              <strong>VISTACOIN</strong>
              <small>A BRIGHTER TOMORROW</small>
            </div>
          </div>
          <div className="art-lock" aria-hidden="true"><span /></div>
        </div>
      </section>

      <div className="readiness-banner" role="note">
        <span className="readiness-icon" aria-hidden="true">!</span>
        <p><strong>Demo only — Sepolia test tokens.</strong> Real-money escrow is not enabled. Customer records are private to approved staff.</p>
        <span className="readiness-state">LIVE ESCROW · NOT ENABLED</span>
      </div>

      <section className="built-for" aria-labelledby="built-for-title">
        <span className="section-icon globe-icon" aria-hidden="true">◎</span>
        <div>
          <h2 id="built-for-title">BUILT FOR:</h2>
          <p>Bullion traders · Gold buyers &amp; sellers · Commodity brokers · Mineral exporters · Aircraft brokers · Charter operators · International trade companies</p>
        </div>
      </section>

      <section className="promise-strip" aria-label="Vistacoin goals">
        <article><span aria-hidden="true">◎</span><strong>Trade with Confidence</strong></article>
        <article><span aria-hidden="true">◉</span><strong>Global Reach</strong></article>
        <article><span aria-hidden="true">♢</span><strong>Clear Transaction Steps</strong></article>
      </section>

      <section className="entry-grid" aria-label="Explore Vistacoin">
        <article className="entry-card">
          <p className="landing-kicker">PUBLIC PREVIEW</p>
          <h2>Try the escrow demo</h2>
          <p>Walk through a sample transaction with fictional details. No wallet, funds, or blockchain transaction is used.</p>
          <Link href="/demo" className="text-gold-link">Open demo <span aria-hidden="true">→</span></Link>
        </article>
        <article className="entry-card">
          <p className="landing-kicker">PRIVATE STAFF AREA</p>
          <h2>Manage customers</h2>
          <p>Approved staff can sign in to the private customer workspace after the Supabase project is configured.</p>
          <Link href="/staff/login" className="text-gold-link">Staff sign in <span aria-hidden="true">→</span></Link>
        </article>
      </section>

      <section className="partner-note">
        <p className="landing-kicker">AEROVISTA GROUP</p>
        <h2>Private aviation · Luxury yachting · Global brokerage</h2>
        <p>Explore Aero Vista Club’s brokerage services through its own website.</p>
        <a className="text-gold-link" href="https://aerovistaclub.co.uk" target="_blank" rel="noreferrer">
          Visit Aero Vista Club <span aria-hidden="true">↗</span>
        </a>
      </section>

      <footer className="site-footer">
        <span>VISTACOIN · DEVELOPMENT PREVIEW</span>
        <span>Sepolia assets have no real-world value. Real-money escrow is not available.</span>
        <Link href="/dashboard">Sepolia token dashboard <span aria-hidden="true">↗</span></Link>
        <span className="legal-links"><Link href="/legal/terms">Terms</Link><Link href="/legal/privacy">Privacy</Link><Link href="/legal/data-breach">Data breach policy</Link></span>
      </footer>
    </main>
  );
}
