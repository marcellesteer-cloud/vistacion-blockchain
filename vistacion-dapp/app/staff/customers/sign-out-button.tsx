"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/src/lib/supabase/browser";

export default function SignOutButton() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  async function signOut() {
    setWorking(true);
    setError("");
    const { error: signOutError } = await createSupabaseBrowserClient().auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
      setWorking(false);
      return;
    }
    router.replace("/staff/login");
    router.refresh();
  }

  return (
    <span className="sign-out-wrap">
      <button className="outline-button sign-out-button" type="button" onClick={() => void signOut()} disabled={working}>
        {working ? "Signing out…" : "Sign out"}
      </button>
      {error && <span className="sign-out-error" role="alert">{error}</span>}
    </span>
  );
}
