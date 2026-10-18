import { useAppState } from "../../models/StateContext";
import { isLive } from "../../models/domainRules";

const ICONS = {
  home: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  pulse: "M3 12h4l3-8 4 16 3-8h4",
  send: "M3 11l18-8-8 18-2-8z",
  list: "M4 6h16M4 12h16M4 18h10",
  check: "M12 22C17.52 22 22 17.52 22 12S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10zm-2-11l3 3 5-6",
  alert: "M12 3l10 18H2zM12 10v5M12 18v.01",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
};

export const Sidebar = () => {
  const { view, setView, calls, mkt, done } = useAppState();
  const visibleCalls = calls.filter((c) => c.b.pack === mkt);
  const liveCount = visibleCalls.filter(isLive).length;

  const attnCount = visibleCalls.filter((c) => {
    if (done[c.id] || isLive(c)) return false;
    return c.outcome?.type === "handoff" || (c.audit && c.audit.score < 90);
  }).length;

  const nav = [
    ["today", "home", "Dashboard"],
    ["live", "pulse", "Live", liveCount],
    ["camps", "send", "Campaigns"],
    ["calls", "list", "Calls"],
    ["follow", "check", "Follow-ups"],
    ["review", "alert", "Review", attnCount],
    ["set", "gear", "Settings"],
  ];

  const currentView = view === "call" ? "calls" : view;

  return (
    <nav className="side" aria-label="Main">
      <div className="logo">
        <span className="bars">
          <i style={{ height: "10px" }} />
          <i style={{ height: "20px" }} />
          <i style={{ height: "26px" }} />
          <i style={{ height: "16px" }} />
          <i style={{ height: "8px" }} />
        </span>
        Lendline
      </div>
      {nav.map(([k, iconName, label, badge]) => (
        <button
          key={k}
          className={`nv ${currentView === k ? "on" : ""}`}
          onClick={() => setView(k)}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d={ICONS[iconName]} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{label}</span>
          {Boolean(badge) && <b>{badge}</b>}
        </button>
      ))}
      <div className="sys">
        <span className="dot dm" /> Connected (React MVC)
      </div>
    </nav>
  );
};