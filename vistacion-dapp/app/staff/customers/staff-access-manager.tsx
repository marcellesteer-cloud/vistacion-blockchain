"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/src/lib/supabase/browser";

interface StaffMember {
  user_id: string;
  role: "admin" | "staff";
  created_at: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function StaffAccessManager() {
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadMembers() {
    const { data, error: loadError } = await createSupabaseBrowserClient()
      .from("staff_members")
      .select("user_id, role, created_at")
      .order("created_at", { ascending: true });
    if (loadError) setError(`Staff access list could not be loaded: ${loadError.message}`);
    else setMembers((data ?? []) as StaffMember[]);
    setLoading(false);
  }

  useEffect(() => {
    const timer = setTimeout(() => void loadMembers(), 0);
    return () => clearTimeout(timer);
  }, []);

  async function addStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const normalizedId = userId.trim();
    if (!UUID_PATTERN.test(normalizedId)) {
      setError("Enter the valid user UUID of an account already invited in Supabase Authentication.");
      return;
    }
    setWorking(true);
    const { error: insertError } = await createSupabaseBrowserClient()
      .from("staff_members")
      .insert({ user_id: normalizedId, role: "staff" });
    if (insertError) {
      setError(`Staff access could not be added: ${insertError.message}`);
    } else {
      setUserId("");
      setNotice("Staff access granted.");
      await loadMembers();
    }
    setWorking(false);
  }

  async function revoke(member: StaffMember) {
    if (member.role === "admin") return;
    if (!window.confirm(`Revoke staff access for ${member.user_id}? They will no longer be able to view or manage customer records.`)) return;
    setWorking(true);
    setError("");
    setNotice("");
    const { error: deleteError } = await createSupabaseBrowserClient()
      .from("staff_members")
      .delete()
      .eq("user_id", member.user_id);
    if (deleteError) {
      setError(`Staff access could not be revoked: ${deleteError.message}`);
    } else {
      setMembers((current) => current.filter((item) => item.user_id !== member.user_id));
      setNotice("Staff access revoked.");
    }
    setWorking(false);
  }

  return (
    <section className="staff-access-panel" aria-labelledby="staff-access-title">
      <div className="customer-form-heading">
        <div>
          <p className="landing-kicker">ADMINISTRATOR CONTROLS</p>
          <h2 id="staff-access-title">Staff access</h2>
        </div>
        <span className="admin-badge">ADMIN ONLY</span>
      </div>
      <p className="staff-access-copy">Invite a person in Supabase Authentication first, then grant access here using their user UUID. Approved staff can view and manage every customer record; grant access only where needed and revoke it promptly when no longer required.</p>
      <form className="staff-access-form" onSubmit={(event) => void addStaff(event)}>
        <label htmlFor="staff-user-id">Invited user UUID</label>
        <div>
          <input id="staff-user-id" value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="00000000-0000-4000-8000-000000000000" autoComplete="off" required />
          <button className="gold-button" type="submit" disabled={working}>{working ? "Working…" : "Grant staff access"}</button>
        </div>
      </form>
      {error && <p className="form-error" role="alert">{error}</p>}
      {notice && <p className="form-success" role="status">{notice}</p>}
      <div className="staff-access-list">
        <h3>Approved accounts</h3>
        {loading ? <p>Loading staff access…</p> : members.length === 0 ? <p>No approved staff accounts.</p> : members.map((member) => (
          <div className="staff-access-row" key={member.user_id}>
            <code>{member.user_id}</code>
            <span className={`customer-status ${member.role === "admin" ? "status-qualified" : ""}`}>{member.role}</span>
            {member.role === "staff" ? (
              <button className="customer-action customer-delete" type="button" disabled={working} onClick={() => void revoke(member)}>Revoke</button>
            ) : (
              <span className="primary-admin-label">Admin</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
