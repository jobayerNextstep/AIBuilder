import React, { useState } from "react";
import { useAppState } from "../models/StateContext";
import { RS } from "../models/constants";
import { fmt, isLive, tk } from "../models/domainRules";
import { AttentionRow, QueueRow } from "./components/Rows";

function renderSparkline(a) {
  const safeArr = a && a.length > 0 ? a : [10, 15, 12, 18, 20, 25, 22];
  const m = Math.max(...safeArr, 1);
  const n = Math.min(...safeArr);
  const w = 96, h = 26;
  const points = safeArr
    .map((v, i) => `${((i * w) / Math.max(1, safeArr.length - 1)).toFixed(1)},${(h - 3 - ((h - 6) * (v - n)) / (m - n || 1)).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
      <polyline fill="none" stroke="var(--pr)" strokeWidth="2" strokeLinejoin="round" points={points} />
    </svg>
  );
}

function renderChart(series) {
  const d = series && series.length > 0 ? series : [];
  const W = 640, H = 210, p = 30;
  const m = Math.max(1, ...d.map((x) => x.calls));
  const bw = (W - p * 2) / Math.max(1, d.length);
  const y = (v) => H - p - ((H - p * 2) * v) / m;
  const cx = (i) => p + i * bw + bw / 2;

  const points = d.map((x, i) => `${cx(i)},${y(x.promises || x.prom || 0)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Calls and promises per day" style={{ width: "100%", height: "auto" }}>
      <defs>
        <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#bfdbfe" stopOpacity=".4" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((t) => (
        <React.Fragment key={t}>
          <line x1={p} x2={W - p} y1={y(m * t)} y2={y(m * t)} stroke="var(--bd)" />
          <text x={p - 6} y={y(m * t) + 4} textAnchor="end" fontSize="10" fill="var(--mu)">
            {Math.round(m * t)}
          </text>
        </React.Fragment>
      ))}
      {d.map((x, i) => (
        <React.Fragment key={x.date || i}>
          <rect x={p + i * bw + 5} y={y(x.calls)} width={Math.max(2, bw - 10)} height={Math.max(0, H - p - y(x.calls))} rx="3" fill="url(#gb)" />
          {i % 2 === 0 && (
            <text x={cx(i)} y={H - 10} textAnchor="middle" fontSize="10" fill="var(--mu)">
              {x.day || (x.date ? x.date.slice(8) : i)}
            </text>
          )}
        </React.Fragment>
      ))}
      <polyline fill="none" stroke="#10b981" strokeWidth="3" points={points} />
      {d.map((x, i) => (
        <circle key={x.date || i} cx={cx(i)} cy={y(x.promises || x.prom || 0)} r="3.5" fill="#fff" stroke="#10b981" strokeWidth="2" />
      ))}
    </svg>
  );
}

export const DashboardView = ({ onCall, onCallMultiple, onOpenCall, onDoneItem }) => {
  const { calls, bs, mkt, name, setView, dashboardData, done } = useAppState();
  const [selectedIds, setSelectedIds] = useState([]);

  // ব্যাকএন্ড API ডেটা অথবা লোকাল ক্যালকুলেশন
  const stats = dashboardData?.stats || {
    totalCalls: calls.length,
    promiseRate: 67,
    promisedValue: 12000,
    avgRuleScore: 91.7,
    humanHandoffs: 0,
  };

  const chartSeries = dashboardData?.chartSeries || [];
  const funnel = dashboardData?.funnel || { dialed: stats.totalCalls, answered: 2, promised: 2, paid: 0 };
  const whyMissed = dashboardData?.whyMissed || { financial_difficulty: 3, illness: 0, forgot: 0, dispute: 0, income_timing: 0, other: 0 };
  const maxWhy = Math.max(1, ...Object.values(whyMissed));

  // Attention List (API থেকে অথবা লোকাল)
  const attentionList = (dashboardData?.attentionList || [])
    .filter((item) => !done[item.c?.id]);

  const visCalls = calls.filter((c) => (c.b?.pack || "bd") === mkt);
  const liveCalls = visCalls.filter(isLive);

  // Who to call Queue
  const callQueue = bs.filter((b) => (b.pack || "bd") === mkt && !visCalls.some((c) => c.b?.id === b.id && isLive(c)));
  const visibleQueue = callQueue.slice(0, 4);

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    const allSelected = visibleQueue.every((b) => selectedIds.includes(b.id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleQueue.some((b) => b.id === id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleQueue.map((b) => b.id)])));
    }
  };

  const h = new Date().getHours();

  return (
    <div>
      {/* Title Header */}
      <div className="chead">
        <div className="grow">
          <h1>Good {h < 12 ? "morning" : h < 18 ? "afternoon" : "evening"}, {name.split(" ")[0]}</h1>
          <p className="sub" style={{ margin: "2px 0 0" }}>
            {attentionList.length ? `${attentionList.length} call${attentionList.length > 1 ? "s" : ""} need your attention.` : "You're all caught up."}
          </p>
        </div>
        <span className="pl y">Sample data</span>
        <span className="mu">Last 14 days</span>
      </div>

      {/* Live Call Banner */}
      {liveCalls.length > 0 && (
        <div className="live" role="button" tabIndex={0} onClick={() => setView("live")}>
          <span className="ld" />
          <div className="grow">
            <b>{liveCalls.length} call{liveCalls.length > 1 ? "s" : ""} in progress</b>
            <small>Open the live wall to watch them</small>
          </div>
          <span className="btn sm" style={{ display: "inline-grid", placeItems: "center" }}>Open</span>
        </div>
      )}

      {/* 5 KPI CARDS */}
      <div className="kp5">
        <div className="card kc2">
          <small>Calls</small>
          <b>{fmt(stats.totalCalls)}</b>
          <div className="dl"><span className="pl r">▲ 6%</span> <span className="mu">vs previous 7 days</span></div>
          {renderSparkline(chartSeries.map((x) => x.calls))}
        </div>

        <div className="card kc2">
          <small>Promise rate</small>
          <b>{stats.promiseRate}%</b>
          <div className="dl"><span className="pl g">▲ 4 pts</span> <span className="mu">vs previous 7 days</span></div>
          {renderSparkline(chartSeries.map((x) => x.promises))}
        </div>

        <div className="card kc2">
          <small>Promised value</small>
          <b>{tk(stats.promisedValue)}</b>
          <div className="dl"><span className="pl r">▲ 28%</span> <span className="mu">vs previous 7 days</span></div>
          {renderSparkline(chartSeries.map((x) => x.promises * 5000))}
        </div>

        <div className="card kc2">
          <small>Rule-check score</small>
          <b>{stats.avgRuleScore}%</b>
          <div className="dl"><span className="mu">Overall compliance</span></div>
          {renderSparkline([90, 92, 95, 91, 94, 96, 92])}
        </div>

        <div className="card kc2">
          <small>Human handoffs</small>
          <b>{fmt(stats.humanHandoffs)}</b>
          <div className="dl"><span className="pl r">▲ 0%</span> <span className="mu">vs previous 7 days</span></div>
          {renderSparkline([0, 0, 0, 0, 0, 0, 0])}
        </div>
      </div>

      {/* CHARTS, FUNNEL & REASONS */}
      <div className="g2">
        <section className="card pad">
          <div className="lh">
            <h2>Calls and promises per day</h2>
            <span className="grow" />
            <span className="lgd">
              <i style={{ background: "linear-gradient(#3b82f6,#bfdbfe)" }} />Calls
              <i style={{ background: "#10b981" }} />Promises
            </span>
          </div>
          {renderChart(chartSeries)}
        </section>

        <div>
          <section className="card pad">
            <h2>Recovery funnel</h2>
            {[
              ["Dialed", funnel.dialed],
              ["Answered", funnel.answered],
              ["Promised", funnel.promised],
              ["Paid", funnel.paid],
            ].map(([l, v]) => (
              <div className="fn" key={l}>
                <span>{l}</span>
                <i style={{ width: `${Math.max(2, Math.round((62 * v) / Math.max(1, funnel.dialed)))}%` }} />
                <b>{fmt(v)}</b>
              </div>
            ))}
            <p className="sub" style={{ margin: "6px 0 0", fontSize: "12.5px" }}>
              Paid counts promises that staff marked as paid.
            </p>
          </section>

          <section className="card pad">
            <h2>Why payments were missed</h2>
            {Object.entries(whyMissed).map(([k, v]) => (
              <div className="bar" key={k}>
                <span>{RS[k] || k}</span>
                <i style={{ width: `${Math.round((100 * v) / maxWhy)}%` }} />
                <b>{v}</b>
              </div>
            ))}
          </section>
        </div>
      </div>

      {/* QUEUE & ATTENTION LIST */}
      <div className="g2" style={{ marginTop: 5 }}>
        {/* Needs your attention card */}
        <section className="card">
          <div className="lh">
            <h2>Needs your attention</h2>
            <span className="grow" />
            <button className="lk" onClick={() => setView("review")}>See all</button>
          </div>
          {attentionList.slice(0, 4).map((x, idx) => (
            <AttentionRow key={x.c?.id || idx} item={x} onOpen={onOpenCall} onDone={onDoneItem} />
          ))}
          {attentionList.length === 0 && <div className="empty">Nothing needs attention.</div>}
        </section>

        {/* Who to call card */}
        <section className="card">
          <div className="lh" style={{ paddingBottom: "10px" }}>
            <h2>Who to call ({callQueue.length})</h2>
            <span className="grow" />
            {selectedIds.length > 0 ? (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button className="btn sm" onClick={() => { onCallMultiple(selectedIds); setSelectedIds([]); }}>
                  Call Selected ({selectedIds.length})
                </button>
                <button className="btn o sm" onClick={() => setSelectedIds([])}>Clear</button>
              </div>
            ) : (
              callQueue.length > 0 && <button className="btn sm" onClick={() => onCall(callQueue[0].id)}>Call next</button>
            )}
          </div>

          {visibleQueue.length > 0 && (
            <div style={{ padding: "8px 16px", borderBottom: "1px solid var(--bd)", background: "var(--prs)", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", margin: 0 }}>
                <input
                  type="checkbox"
                  checked={visibleQueue.length > 0 && visibleQueue.every((b) => selectedIds.includes(b.id))}
                  onChange={handleSelectAll}
                  style={{ width: "15px", height: "15px", cursor: "pointer", accentColor: "var(--pr)" }}
                />
                <b>Select All Visible</b>
              </label>
              {selectedIds.length > 0 && <span className="mu">({selectedIds.length} borrower selected)</span>}
            </div>
          )}

          {visibleQueue.map((b) => (
            <QueueRow key={b.id} borrower={b} isSelected={selectedIds.includes(b.id)} onToggleSelect={handleToggleSelect} onCall={onCall} />
          ))}
          {callQueue.length === 0 && <div className="empty">No one to call right now.</div>}
        </section>
      </div>
    </div>
  );
};