"use client";

import { useState } from "react";

const stages = [
  { title: "Deal drafted", detail: "Buyer and seller agree on the example terms before starting." },
  { title: "Funds held", detail: "In a real system, funds would only be held by a reviewed escrow contract." },
  { title: "Delivery confirmed", detail: "The seller marks the example delivery step as complete." },
  { title: "Review and outcome", detail: "A clear, agreed dispute and release process would determine the outcome." },
];

export default function DemoWalkthrough() {
  const [stage, setStage] = useState(0);

  return (
    <section className="demo-board" aria-labelledby="demo-deal-title">
      <div className="demo-deal-heading">
        <div>
          <p className="landing-kicker">SAMPLE DEAL · NOT A REAL TRANSACTION</p>
          <h2 id="demo-deal-title">Gold shipment — Example #VC-2048</h2>
        </div>
        <span className="demo-status"><span />{stages[stage].title}</span>
      </div>
      <div className="demo-deal-details">
        <div><span>Buyer</span><strong>Northstar Trading (sample)</strong></div>
        <div><span>Seller</span><strong>Meridian Metals (sample)</strong></div>
        <div><span>Example value</span><strong>12,500 VSC · fictional</strong></div>
      </div>
      <div className="demo-fee-breakdown" aria-label="Illustrative example fee">
        <div><span>Illustrative platform fee · 5% of example amount</span><strong>625 VSC</strong></div>
        <div><span>Example seller proceeds after fee</span><strong>11,875 VSC</strong></div>
        <p>Example only: fee deducted from seller proceeds. No fee is charged, collected, or transferred.</p>
      </div>
      <div className="demo-progress" aria-label={`Demo step ${stage + 1} of ${stages.length}`}>
        {stages.map((item, index) => (
          <div className={`demo-step ${index <= stage ? "is-current" : ""}`} key={item.title}>
            <span>{index < stage ? "✓" : `0${index + 1}`}</span>
            <strong>{item.title}</strong>
          </div>
        ))}
      </div>
      <div className="demo-stage-copy" aria-live="polite">
        <h3>{stages[stage].title}</h3>
        <p>{stages[stage].detail}</p>
      </div>
      <button
        className="gold-button demo-next"
        type="button"
        onClick={() => setStage((current) => (current + 1) % stages.length)}
      >
        {stage === stages.length - 1 ? "Restart walkthrough" : "Continue walkthrough"}
        <span aria-hidden="true">→</span>
      </button>
      <p className="demo-disclaimer">
        This is a visual prototype only. No wallet is connected, and nothing is written to a blockchain.
      </p>
    </section>
  );
}
