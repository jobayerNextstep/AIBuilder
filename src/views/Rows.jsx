import { ago, ini, isLive, over, resTxt, tk } from "../../models/domainRules";

export const QueueRow = ({ borrower, isSelected, onToggleSelect, onCall }) => {
  const d = over(borrower);
  return (
    <div
      className="row"
      style={{ display: "flex", alignItems: "center", gap: "10px" }}
    >
      <input
        type="checkbox"
        checked={Boolean(isSelected)}
        onChange={() => onToggleSelect(borrower.id)}
        style={{
          width: "16px",
          height: "16px",
          cursor: "pointer",
          accentColor: "var(--pr)",
          margin: 0,
        }}
      />
      <span className="av">{ini(borrower.name)}</span>
      <div className="grow">
        <b>{borrower.name}</b>
        <small>
          {tk(borrower.amountDue)} due
          {borrower.product ? ` · ${borrower.product}` : ""}
        </small>
      </div>
      <span className={`pl ${d >= 30 ? "r" : d >= 7 ? "y" : ""}`}>
        {d} days late
      </span>
      <button className="btn o sm" onClick={() => onCall(borrower.id)}>
        Call
      </button>
    </div>
  );
};

export const AttentionRow = ({ item, onOpen, onDone }) => {
  const c = item.c;
  const borrower = c.b || c.borrower || {};
  return (
    <div className="row">
      <span className="av">{ini(borrower.name || "Customer")}</span>
      <div className="grow">
        <b>{borrower.name || "Customer"}</b>
        <small>{item.why}</small>
      </div>
      <button className="btn o sm" onClick={() => onOpen(c.id || c.callId)}>
        Open
      </button>
      <button className="btn o sm" onClick={() => onDone(c.id || c.callId)}>
        Done
      </button>
    </div>
  );
};

export const CallRow = ({ call, onOpen }) => {
  const o = call.outcome;
  const borrower = call.b || call.borrower || {};
  const badge = isLive(call) ? (
    <span className="pl b">Live</span>
  ) : !o ? (
    <span className="pl">Ended</span>
  ) : o.type === "promise" ? (
    <span className="pl g">Promise</span>
  ) : o.type === "handoff" ? (
    <span className="pl y">Needs human</span>
  ) : (
    <span className="pl">
      {o.type === "callback" ? "Call back" : "No promise"}
    </span>
  );

  return (
    <div
      className="row hov"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(call.id)}
    >
      <span className="av">{ini(borrower.name || "Customer")}</span>
      <div className="grow">
        <b>{borrower.name || "Customer"}</b>
        <small>
          {ago(call.startedAt)} ·{" "}
          {isLive(call) ? "In progress" : resTxt(call.outcome)}
        </small>
      </div>
      {badge}
      <span className="mu">›</span>
    </div>
  );
};

export const FollowupRow = ({
  call,
  category,
  keptStatus,
  onKept,
  onUndo,
  onCallAgain,
}) => {
  const o = call.outcome || {};
  const borrower = call.b || call.borrower || {};
  const callKey = call.callId || call.id;

  return (
    <div className="row">
      <span className="av">{ini(borrower.name || "Customer")}</span>
      <div className="grow">
        <b>{borrower.name || "Customer"}</b>
        <small>
          {tk(o.amount || borrower.amountDue)} by{" "}
          {dsh(o.date || call.startedAt)}
        </small>
      </div>

      {category === "done" ? (
        <>
          <span className={`pl ${keptStatus === "kept" ? "g" : "r"}`}>
            {keptStatus === "kept" ? "Paid" : "Not paid"}
          </span>
          <button className="lk" onClick={() => onUndo(callKey)}>
            Undo
          </button>
        </>
      ) : (
        <>
          <button className="btn o sm" onClick={() => onKept(callKey, "kept")}>
            Paid
          </button>
          {category === "due" && (
            <>
              <button
                className="btn o sm"
                onClick={() => onKept(callKey, "missed")}
              >
                Not paid
              </button>
              <button
                className="btn sm"
                onClick={() => onCallAgain(borrower.id)}
              >
                Call again
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
};
