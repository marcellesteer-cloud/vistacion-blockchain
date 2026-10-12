"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/src/lib/supabase/browser";

export default function StaffLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setWorking(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;
      router.replace("/staff/customers");
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Staff sign-in failed. Try again.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <section className="auth-card">
      <div className="auth-card-heading">
        <span className="auth-lock" aria-hidden="true">◆</span>
        <div>
          <h2>Staff sign in</h2>
          <p>Use an account invited by your Vistacoin workspace administrator.</p>
        </div>
      </div>
      <form className="customer-form" onSubmit={signIn}>
        <label htmlFor="staff-email">Work email</label>
        <input id="staff-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <label htmlFor="staff-password">Password</label>
        <input id="staff-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="gold-button auth-submit" type="submit" disabled={working}>
          {working ? "Signing in…" : "Sign in securely"}
        </button>
      </form>
      <p className="auth-footnote">There is no public sign-up. Ask an administrator to invite and approve your staff account.</p>
    </section>
  );
}
