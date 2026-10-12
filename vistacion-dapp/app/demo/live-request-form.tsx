"use client";

import { useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/src/lib/supabase/browser";
import { isSupabaseConfigured } from "@/src/lib/supabase/config";

const EMPTY = {
  contact_name: "", contact_email: "", organisation: "", buyer: "", seller: "",
  amount: "", asset_type: "", reference: "", expected_delivery: "", notes: "",
};

export default function LiveRequestForm() {
  const [values, setValues] = useState(EMPTY);
  const [consent, setConsent] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const configured = isSupabaseConfigured();

  function set(key: keyof typeof EMPTY, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!consent) {
      setError("Please confirm you have read the Privacy Notice.");
      return;
    }
    setWorking(true);
    const payload = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, value.trim() || null]),
    );
    const { error: insertError } = await createSupabaseBrowserClient()
      .from("onboarding_requests")
      .insert({ ...payload, consent: true });
    if (insertError) setError("Your request could not be sent. Please try again later.");
    else {
      setDone(true);
      setValues(EMPTY);
    }
    setWorking(false);
  }

  if (done) {
    return (
      <div className="live-request" role="status">
        <h2>Request received</h2>
        <p>Thank you. We will contact you to discuss onboarding. No escrow has been created and no funds should be sent.</p>
      </div>
    );
  }

  return (
    <section className="live-request" aria-labelledby="live-request-title">
      <p className="landing-kicker">LIVE MODE · ONBOARDING REQUEST</p>
      <h2 id="live-request-title">Request a live escrow</h2>
      <div className="readiness-banner" role="note">
        <span className="readiness-icon" aria-hidden="true">!</span>
        <p><strong>Live escrow is not yet enabled.</strong> This form only registers your interest. It does not create a contract, connect a wallet or take funds. Approved customers complete identity and compliance checks first. Do not send money.</p>
      </div>
      {!configured ? (
        <p className="form-error">Requests are temporarily unavailable. Please check back soon.</p>
      ) : (
        <form className="live-request-form" onSubmit={(event) => void submit(event)}>
          <label>Your name *<input required maxLength={120} value={values.contact_name} onChange={(e) => set("contact_name", e.target.value)} /></label>
          <label>Email *<input required type="email" maxLength={200} value={values.contact_email} onChange={(e) => set("contact_email", e.target.value)} /></label>
          <label>Organisation<input maxLength={200} value={values.organisation} onChange={(e) => set("organisation", e.target.value)} /></label>
          <label>Buyer<input maxLength={200} value={values.buyer} onChange={(e) => set("buyer", e.target.value)} /></label>
          <label>Seller<input maxLength={200} value={values.seller} onChange={(e) => set("seller", e.target.value)} /></label>
          <label>Amount and currency<input maxLength={60} value={values.amount} onChange={(e) => set("amount", e.target.value)} /></label>
          <label>Asset type<input maxLength={120} value={values.asset_type} onChange={(e) => set("asset_type", e.target.value)} /></label>
          <label>Reference number<input maxLength={120} value={values.reference} onChange={(e) => set("reference", e.target.value)} /></label>
          <label>Expected delivery date<input type="date" value={values.expected_delivery} onChange={(e) => set("expected_delivery", e.target.value)} /></label>
          <label className="live-request-wide">Notes<textarea rows={4} maxLength={2000} value={values.notes} onChange={(e) => set("notes", e.target.value)} /></label>
          <label className="live-request-wide live-request-consent">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>I have read the <a href="/legal/privacy">Privacy Notice</a> and <a href="/legal/terms">Terms</a> and agree to be contacted. Please do not include ID documents or bank details here.</span>
          </label>
          {error && <p className="form-error live-request-wide" role="alert">{error}</p>}
          <button className="gold-button live-request-wide" type="submit" disabled={working}>{working ? "Sending…" : "Send onboarding request"}</button>
        </form>
      )}
    </section>
  );
}