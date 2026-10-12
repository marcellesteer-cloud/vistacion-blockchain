"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/src/lib/supabase/browser";

interface Request {
  id: string;
  created_at: string;
  contact_name: string;
  contact_email: string;
  organisation: string | null;
  buyer: string | null;
  seller: string | null;
  amount: string | null;
  asset_type: string | null;
  reference: string | null;
  expected_delivery: string | null;
  notes: string | null;
  status: "new" | "contacted" | "closed";
}

export default function OnboardingRequests() {
  const [items, setItems] = useState<Request[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(async () => {
      const { data, error: loadError } = await createSupabaseBrowserClient()
        .from("onboarding_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (loadError) setError(`Onboarding requests could not be loaded: ${loadError.message}`);
      else setItems((data ?? []) as Request[]);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  async function setStatus(id: string, status: Request["status"]) {
    const { error: updateError } = await createSupabaseBrowserClient()
      .from("onboarding_requests")
      .update({ status })
      .eq("id", id);
    if (updateError) setError(`Status could not be updated: ${updateError.message}`);
    else setItems((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  return (
    <section className="staff-access-panel" aria-labelledby="onboarding-title">
      <p className="landing-kicker">LIVE MODE · INCOMING REQUESTS</p>
      <h2 id="onboarding-title">Onboarding requests ({items.filter((i) => i.status === "new").length} new)</h2>
      {error && <p className="form-error" role="alert">{error}</p>}
      {items.length === 0 && !error && <p className="staff-access-copy">No requests yet.</p>}
      {items.map((item) => (
        <div className="staff-access-row" key={item.id} style={{ flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 320px", fontSize: 12, lineHeight: 1.6 }}>
            <strong>{item.contact_name}</strong> · {item.contact_email}{item.organisation ? ` · ${item.organisation}` : ""}
            <br />
            {[item.buyer && `Buyer: ${item.buyer}`, item.seller && `Seller: ${item.seller}`, item.amount && `Amount: ${item.amount}`, item.asset_type && `Asset: ${item.asset_type}`, item.reference && `Ref: ${item.reference}`, item.expected_delivery && `Delivery: ${item.expected_delivery}`].filter(Boolean).join(" · ")}
            {item.notes && <><br />{item.notes}</>}
            <br /><small>{new Date(item.created_at).toLocaleString("en-GB")}</small>
          </div>
          <select value={item.status} onChange={(e) => void setStatus(item.id, e.target.value as Request["status"])} aria-label="Request status">
            <option value="new">new</option>
            <option value="contacted">contacted</option>
            <option value="closed">closed</option>
          </select>
        </div>
      ))}
    </section>
  );
}