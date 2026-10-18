import { useAppState } from "../models/StateContext";
import { isLive } from "../models/domainRules";
import { CallRow } from "./components/Rows";

export const CallsListView = ({ onOpenCall, onExport }) => {
  const { calls, mkt, q, setQ, fil, setFil } = useAppState();

  const query = q.toLowerCase();
  const filtered = calls
    .filter((c) => (c.b?.pack || "bd") === mkt)
    .filter((c) => {
      const name = (c.b?.name || c.borrower?.name || "").toLowerCase();
      const matchName = !query || name.includes(query);
      const t = c.outcome?.type;
      const matchFilter =
        fil === "all" ||
        (fil === "live" && isLive(c)) ||
        (fil === "promise" && t === "promise") ||
        (fil === "human" && t === "handoff") ||
        (fil === "other" && t && !["promise", "handoff"].includes(t));
      return matchName && matchFilter;
    });

  const filterChips = [
    ["all", "All"],
    ["live", "Live"],
    ["promise", "Promises"],
    ["human", "Needs human"],
    ["other", "Other"],
  ];

  return (
    <div>
      <div className="chead">
        <h1 className="grow">Calls</h1>
        <button className="btn o sm" onClick={() => onExport(filtered)}>Download CSV</button>
      </div>

      <div className="bar2">
        <input
          type="search"
          placeholder="Search by name"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search calls"
        />
        {filterChips.map(([k, lbl]) => (
          <button
            key={k}
            className={`chip ${fil === k ? "on" : ""}`}
            onClick={() => setFil(k)}
          >
            {lbl}
          </button>
        ))}
      </div>

      <section className="card">
        {filtered.map((c) => (
          <CallRow key={c.id || c.callId} call={c} onOpen={onOpenCall} />
        ))}
        {filtered.length === 0 && <div className="empty">No calls match. Start one from Today.</div>}
      </section>
    </div>
  );
};