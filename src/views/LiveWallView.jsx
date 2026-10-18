import { useAppState } from "../models/StateContext";
import { isLive, mmss, over, stepOf, tk } from "../models/domainRules";

export const LiveWallView = ({ onOpenCall, onEndCall }) => {
  const { calls, bs, mkt } = useAppState();

  const vis = calls.filter((c) => (c.b?.pack || "bd") === mkt);
  const liveCalls = vis.filter(isLive);
  const queueCount = bs.filter((b) => (b.pack || "bd") === mkt && !vis.some((c) => c.b?.id === b.id && isLive(c))).length;

  return (
    <div>
      <div className="chead">
        <h1 className="grow">Live calls</h1>
        <span className="pl b">{liveCalls.length} live</span>
        <span className="mu">{queueCount} waiting to be called</span>
      </div>
      <p className="sub">Every active call at once. Open one to see the whole conversation.</p>

      {liveCalls.length > 0 ? (
        <div className="wall">
          {liveCalls.map((c) => {
            const p = [0, 0, 1, 1, 2, 2, 3, 4][stepOf(c)];
            const b = c.b || c.borrower || {};
            const transcripts = c.transcript || c.transcripts || [];

            return (
              <div className="tile" key={c.id}>
                <div className="lh" style={{ padding: 0 }}>
                  <span className="ld" />
                  <b>{b.name || "Customer"}</b>
                  <span className="grow" />
                  <span className="timer" style={{ fontSize: "16px" }}>{mmss(c.startedAt)}</span>
                </div>
                <small>{tk(b.amountDue)} due · {over(b)} days late</small>
                <div className="steps sm" style={{ margin: "8px 0" }}>
                  {["Greeting", "Understanding", "Offer", "Confirmation"].map((n, i) => (
                    <span key={n} className={i < p ? "d" : i === p ? "c" : ""}>{n}</span>
                  ))}
                </div>
                {transcripts.slice(-2).map((m, idx) => (
                  <p key={idx}>
                    <small>{m.role === "agent" ? "AI" : "Borrower"}</small>
                    {m.text}
                  </p>
                ))}
                {transcripts.length === 0 && <p className="mu">Connecting…</p>}
                <div className="mb" style={{ marginTop: "10px" }}>
                  <button className="btn o sm" onClick={() => onEndCall(c.id)}>End</button>
                  <button className="btn sm" onClick={() => onOpenCall(c.id)}>Watch</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card empty">No calls are live. Start one from the Dashboard, or launch a campaign.</div>
      )}
    </div>
  );
};