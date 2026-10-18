// src/views/CallDetailView.jsx
import { useEffect, useState } from "react";
import { useAppState } from "../models/StateContext";
import { RS } from "../models/constants";
import {
  ini,
  isLive,
  mmss,
  offerTxt,
  over, // ✅ এই ফাংশনটি ইমপোর্টে যোগ করা হয়েছে
  plain,
  resTxt,
  tk,
  verdict,
} from "../models/domainRules";

export const CallDetailView = ({ onHangup, onHandoff, onOpenEdit }) => {
  const { calls, sel, packs, setView, tr, setTr } = useAppState();
  const [, setTicker] = useState(0);

  const c = calls.find((x) => x.id === sel || x.callId === sel);
  const live = isLive(c);

  // লাইভ চলাকালীন প্রতি সেকেন্ডে টাইমার টিক করবে
  useEffect(() => {
    let timer = null;
    if (live) {
      timer = setInterval(() => {
        setTicker((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [live]);

  if (!c) {
    return (
      <div>
        <p>Call not found.</p>
        <button className="btn" onClick={() => setView("calls")}>
          Back to calls
        </button>
      </div>
    );
  }

  const b = c.b || c.borrower || {};
  const pack = packs.find((p) => p.id === (b.pack || "bd"));
  
  // স্টেপ ক্যালকুলেশন
  const currentStep = [0, 0, 1, 1, 2, 2, 3, 4][
    c.stageReached === "Confirmation"
      ? 6
      : c.stageReached === "Offer"
      ? 4
      : c.stageReached === "Understanding"
      ? 2
      : 0
  ] || 0;

  const v = verdict(c.audit);
  const allowedOffers = offerTxt(c, pack);
  const transcripts = c.transcript || c.transcripts || [];

  // লাইভ সিগন্যাল অনুযায়ী স্ট্যাটাস ফ্ল্যাগ
  const isDialing = c.status === "dialing";
  const isLiveNow = c.status === "live";
  const isProcessing = c.status === "processing";
  const isCompleted = c.status === "completed" || c.status === "ended";

  return (
    <div>
      <button className="lk" onClick={() => setView("calls")}>
        ← All calls
      </button>

      {/* Header Info */}
      <div className="chead">
        <span className="av lg">{ini(b.name || "Customer")}</span>
        <div className="grow">
          <h1>{b.name || "Customer"}</h1>
          <p className="sub" style={{ margin: "2px 0 0" }}>
            {b.phone} · {tk(b.amountDue || 0)} due · {over(b)} days late
          </p>
        </div>

        {/* কল স্ট্যাটাস ব্যাজ ও অ্যাকশন বাটন */}
        {isDialing && (
          <div className="cact">
            <span className="pl y">Dialing / Ringing... ⏳</span>
            <button className="btn red sm" onClick={onHangup}>
              Cancel
            </button>
          </div>
        )}

        {isLiveNow && (
          <div className="cact">
            <span className="timer">{mmss(c.startedAt)}</span>
            <button className="btn o" onClick={onHandoff}>
              Hand to a human
            </button>
            <button className="btn red" onClick={onHangup}>
              End call
            </button>
          </div>
        )}

        {isProcessing && (
          <span className="pl b">Processing Transcript & AI Audit...</span>
        )}

        {isCompleted && (
          <div className="cact">
            <span className={`pl ${c.outcome?.type === "handoff" ? "y" : "g"}`}>
              {resTxt(c.outcome)}
            </span>
            <button className="btn o sm" onClick={onOpenEdit}>
              Edit result
            </button>
          </div>
        )}
      </div>

      {/* লাইভ ব্যানার */}
      {isLiveNow && (
        <div className="live" style={{ marginBottom: "14px" }}>
          <span className="ld" />
          <div className="grow">
            <b>Call connected & actively speaking...</b>
          </div>
        </div>
      )}

      {/* Stage Badges */}
      <div className="steps">
        {["Greeting", "Understanding", "Offer", "Confirmation"].map((n, i) => (
          <span
            key={n}
            className={i < currentStep ? "d" : i === currentStep ? "c" : ""}
          >
            {i < currentStep ? "✔ " : ""}
            {n}
          </span>
        ))}
      </div>

      {/* কল শেষ হওয়ার পর রেজাল্ট কার্ড */}
      {isCompleted && c.outcome && (
        <section className="card pad res">
          <div className="lh">
            <h2>Result</h2>
            <span className="grow" />
            <button className="btn o sm" onClick={onOpenEdit}>
              Edit result
            </button>
          </div>
          <p className="big">{resTxt(c.outcome)}</p>
          {c.outcome?.reason && (
            <p className="sub" style={{ margin: "0 0 8px" }}>
              Reason: {RS[c.outcome.reason] || c.outcome.reason}
            </p>
          )}
          <p style={{ margin: 0 }}>
            Rule check: <span className={`pl ${v[0]}`}>{v[1]}</span>{" "}
            {c.audit?.notes || ""}
          </p>
        </section>
      )}

      {/* Conversation & Policy Checks Grid */}
      <div className="cg">
        {/* Left: Transcript bubbles */}
        <section className="card pad">
          <div className="lh">
            <h2>Conversation ({transcripts.length})</h2>
            <span className="grow" />
            <label className="sw">
              <input type="checkbox" checked={tr} onChange={() => setTr(!tr)} />{" "}
              Show English
            </label>
          </div>
          <div
            className="conv"
            style={{ maxHeight: "500px", overflowY: "auto" }}
          >
            {transcripts.map((m, i) => (
              <div key={i} className={`m ${m.role}`}>
                <small>
                  {m.role === "agent"
                    ? "AI"
                    : b.name
                    ? b.name.split(" ")[0]
                    : "Borrower"}
                  {m.at ? ` · ${mmss(c.startedAt, m.at)}` : ""}
                </small>
                <div className="bub">
                  {m.text}
                  {tr && m.en && <i>{m.en}</i>}
                </div>
              </div>
            ))}
            {transcripts.length === 0 && (
              <p className="mu">Waiting for audio speech…</p>
            )}
          </div>
          {live && (
            <p className="sub" style={{ margin: "8px 0 0" }}>
              The AI is handling this call. You can end it or hand it to a human
              at any time.
            </p>
          )}
        </section>

        {/* Right: What AI may offer & Checks */}
        <div>
          <section className="card pad">
            <h2>What the AI may offer</h2>
            {allowedOffers.map((t, idx) => (
              <div className="of" key={idx}>
                {t}
              </div>
            ))}
            <p className="sub" style={{ margin: 0 }}>
              It cannot offer anything else.
            </p>
          </section>

          <section className="card pad">
            <h2>Checks</h2>
            {(c.checks && c.checks.length > 0
              ? c.checks
              : [
                  { t: "Told the borrower the call is recorded", ok: true },
                  { t: "Used only the offers allowed by policy", ok: true },
                  {
                    t: "Borrower confirmed the amount and date",
                    ok: c.outcome?.type === "promise",
                  },
                ]
            ).map((k, idx) => (
              <div key={idx} className={`ck ${k.ok ? "ok" : "bad"}`}>
                {k.ok ? "✔" : "✗"} {plain(k.t)}
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
};