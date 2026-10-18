import {
  ago,
  dsh,
  ini,
  isLive,
  over,
  resTxt,
  tk,
} from "../../models/domainRules";

export const QueueRow = ({ borrower, onCall }) => {
  const d = over(borrower);
  return (
    <div className="row">
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
  const c = item.c || {};
  const borrower = c.b || c.borrower || {};
  const callKey = c.callId || c.id;

  return (
    <div className="row">
      <span className="av">{ini(borrower.name || "Customer")}</span>
      <div className="grow">
        <b>{borrower.name || "Customer"}</b>
        <small>{item.why}</small>
      </div>
      <button className="btn o sm" onClick={() => onOpen(callKey)}>
        Open
      </button>
      <button className="btn o sm" onClick={() => onDone(callKey)}>
        Done
      </button>
    </div>
  );
};

export const CallRow = ({ call, onOpen }) => {
  const o = call.outcome;
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
      <span className="av">{ini(call.b.name)}</span>
      <div className="grow">
        <b>{call.b.name}</b>
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
  const o = call.outcome;
  return (
    <div className="row">
      <span className="av">{ini(call.b.name)}</span>
      <div className="grow">
        <b>{call.b.name}</b>
        <small>
          {tk(o.amount)} by {dsh(o.date)}
        </small>
      </div>
      {category === "done" ? (
        <>
          <span className={`pl ${keptStatus === "kept" ? "g" : "r"}`}>
            {keptStatus === "kept" ? "Paid" : "Not paid"}
          </span>
          <button className="lk" onClick={() => onUndo(call.id)}>
            Undo
          </button>
        </>
      ) : (
        <>
          <button className="btn o sm" onClick={() => onKept(call.id, "kept")}>
            Paid
          </button>
          {category === "due" && (
            <>
              <button
                className="btn o sm"
                onClick={() => onKept(call.id, "missed")}
              >
                Not paid
              </button>
              <button
                className="btn sm"
                onClick={() => onCallAgain(call.borrowerId)}
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
