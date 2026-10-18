import { useAppState } from "../models/StateContext";
import { RS } from "../models/constants";
import { ini, isLive, mmss, offerTxt, over, plain, resTxt, tk, verdict } from "../models/domainRules";

export const CallDetailView = ({ onHangup, onHandoff, onOpenEdit }) => {
  const { calls, sel, packs, setView, tr, setTr } = useAppState();
  const c = calls.find((x) => x.id === sel || x.callId === sel);

  if (!c) {
    return (
      <div>
        <p>Call not found.</p>
        <button className="btn" onClick={() => setView("calls")}>Back to calls</button>
      </div>
    );
  }

  const b = c.b || c.borrower || {};
  const pack = packs.find((p) => p.id === (b.pack || "bd"));
  const live = isLive(c);
  const currentStep = [0, 0, 1, 1, 2, 2, 3, 4][(c.stageReached === "Confirmation" ? 6 : c.stageReached === "Offer" ? 4 : 2)];
  const v = verdict(c.audit);
  const allowedOffers = offerTxt(c, pack);
  const transcripts = c.transcript || c.transcripts || [];

  return (
    <div>
      <button className="lk" onClick={() => setView("calls")}>← All calls</button>

      {/* Header Info */}
      <div className="chead">
        <span className="av lg">{ini(b.name || "Customer")}</span>
        <div className="grow">
          <h1>{b.name || "Customer"}</h1>
          <p className="sub" style={{ margin: "2px 0 0" }}>
            {b.phone} · {tk(b.amountDue)} due · {over(b)} days late
          </p>
        </div>

        {live ? (
          <div className="cact">
            <span className="timer">{mmss(c.startedAt)}</span>
            <button className="btn o" onClick={onHandoff}>Hand to a human</button>
            <button className="btn red" onClick={onHangup}>End call</button>
          </div>
        ) : (
          <div className="cact">
            <span className={`pl ${c.outcome?.type === "handoff" ? "y" : "g"}`}>
              {resTxt(c.outcome)}
            </span>
            <button className="btn o sm" onClick={onOpenEdit}>Edit result</button>
          </div>
        )}
      </div>

      {/* Stage Badges */}
      <div className="steps">
        {["Greeting", "Understanding", "Offer", "Confirmation"].map((n, i) => (
          <span key={n} className={i < currentStep ? "d" : i === currentStep ? "c" : ""}>
            {i < currentStep ? "✔ " : ""}{n}
          </span>
        ))}
      </div>

      {!live && c.outcome && (
        <section className="card pad res">
          <div className="lh">
            <h2>Result</h2>
            <span className="grow" />
            <button className="btn o sm" onClick={onOpenEdit}>Edit result</button>
          </div>
          <p className="big">{resTxt(c.outcome)}</p>
          {c.outcome?.reason && (
            <p className="sub" style={{ margin: "0 0 8px" }}>Reason: {RS[c.outcome.reason] || c.outcome.reason}</p>
          )}
          <p style={{ margin: 0 }}>
            Rule check: <span className={`pl ${v[0]}`}>{v[1]}</span> {c.audit?.notes || ""}
          </p>
        </section>
      )}

      {/* Conversation & Policy Checks Grid */}
      <div className="cg">
        {/* Left: Transcript bubbles */}
        <section className="card pad">
          <div className="lh">
            <h2>Conversation</h2>
            <span className="grow" />
            <label className="sw">
              <input type="checkbox" checked={tr} onChange={() => setTr(!tr)} /> Show English
            </label>
          </div>
          <div className="conv" style={{ maxHeight: "500px", overflowY: "auto" }}>
            {transcripts.map((m, i) => (
              <div key={i} className={`m ${m.role}`}>
                <small>
                  {m.role === "agent" ? "AI" : (b.name ? b.name.split(" ")[0] : "Borrower")}
                  {m.at ? ` · ${mmss(c.startedAt, m.at)}` : ""}
                </small>
                <div className="bub">
                  {m.text}
                  {tr && m.en && <i>{m.en}</i>}
                </div>
              </div>
            ))}
            {transcripts.length === 0 && <p className="mu">Waiting for the call to connect…</p>}
          </div>
          {live && (
            <p className="sub" style={{ margin: "8px 0 0" }}>
              The AI is handling this call. You can end it or hand it to a human at any time.
            </p>
          )}
        </section>

        {/* Right: What AI may offer & Checks */}
        <div>
          <section className="card pad">
            <h2>What the AI may offer</h2>
            {allowedOffers.map((t, idx) => (
              <div className="of" key={idx}>{t}</div>
            ))}
            <p className="sub" style={{ margin: 0 }}>It cannot offer anything else.</p>
          </section>

          <section className="card pad">
            <h2>Checks</h2>
            {(c.checks && c.checks.length > 0 ? c.checks : [
              { t: "Told the borrower the call is recorded", ok: true },
              { t: "Used only the offers allowed by policy", ok: true },
              { t: "Borrower confirmed the amount and date", ok: c.outcome?.type === "promise" }
            ]).map((k, idx) => (
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