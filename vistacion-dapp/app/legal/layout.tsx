import Link from "next/link";
import type { ReactNode } from "react";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <main className="legal-page">
      <Link href="/" className="text-gold-link">← Back to Vistacoin</Link>
      <article className="legal-doc">
        <div className="legal-draft" role="note">
          <strong>DRAFT — not yet legally reviewed.</strong> This document is a template prepared for review by a qualified UK solicitor before any customer relies on it or any live service begins. Bracketed items such as [COMPANY NAME] must be completed. It is not legal advice.
        </div>
        {children}
        <hr />
        <nav className="legal-links" aria-label="Legal documents">
          <Link href="/legal/terms">Terms &amp; Conditions</Link>
          <Link href="/legal/privacy">Privacy Notice</Link>
          <Link href="/legal/data-breach">Data Breach Policy</Link>
        </nav>
      </article>
    </main>
  );
}