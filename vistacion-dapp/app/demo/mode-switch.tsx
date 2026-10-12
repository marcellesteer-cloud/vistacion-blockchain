"use client";

import { useState } from "react";
import DemoWalkthrough from "./walkthrough";
import LiveRequestForm from "./live-request-form";

export default function ModeSwitch() {
  const [mode, setMode] = useState<"demo" | "live">("demo");
  return (
    <>
      <div className="mode-switch" role="tablist" aria-label="Escrow mode">
        <button role="tab" aria-selected={mode === "demo"} className={mode === "demo" ? "active" : ""} onClick={() => setMode("demo")}>Demo mode</button>
        <button role="tab" aria-selected={mode === "live"} className={mode === "live" ? "active" : ""} onClick={() => setMode("live")}>Live mode</button>
      </div>
      {mode === "demo" ? <DemoWalkthrough /> : <LiveRequestForm />}
    </>
  );
}