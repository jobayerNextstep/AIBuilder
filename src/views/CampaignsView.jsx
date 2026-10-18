
import { useEffect, useState } from "react";
import { useAppState } from "../models/StateContext";

export const CampaignsView = ({ onNewCampaign, onToggleCampaign }) => {
  const { camps = [], packs = [], syncWithBackend } = useAppState();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    syncWithBackend();
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await syncWithBackend();
    setRefreshing(false);
  };

  return (
    <div>
      {/* Header Section */}
      <div className="chead">
        <h1 className="grow">Campaigns ({camps.length})</h1>
        <button
          className="btn o sm"
          onClick={handleManualRefresh}
          disabled={refreshing}
          style={{ marginRight: "10px" }}
        >
          {refreshing ? "Refreshing..." : "↻ Refresh"}
        </button>
        <button className="btn" onClick={onNewCampaign}>
          New campaign
        </button>
      </div>

      <p className="sub" style={{ marginTop: 0 }}>
        A campaign calls a list of borrowers inside the market's calling hours,
        retries those who don't answer, and stops when they promise to pay.
      </p>

      {/* Campaign Cards List */}
      {(camps || []).map((c) => {
        const s = c.stats || {
          total: 0,
          queued: 0,
          calling: 0,
          promise: 0,
          handoff: 0,
          exhausted: 0,
          failed: 0,
        };

        // প্রগ্রেস পার্সেন্টেজ হিসাব
        const done = (s.total || 0) - (s.queued || 0) - (s.calling || 0);
        const pct = Math.max(
          0,
          Math.min(
            100,
            Math.round((100 * Math.max(0, done)) / Math.max(1, s.total))
          )
        );

        const packInfo = packs.find((p) => p.id === c.pack);
        const packName = packInfo?.name || "Bangladesh (BN)";

        const isRunning = c.status === "running";
        const isPaused = c.status === "paused";
        const isDone = c.status === "completed" || c.status === "done";

        return (
          <section className="card pad" key={c.id}>
            {/* Top row */}
            <div className="lh" style={{ padding: "0 0 10px" }}>
              <h2>{c.name}</h2>
              <span
                className={`pl ${
                  isRunning ? "g" : isPaused ? "y" : isDone ? "b" : ""
                }`}
              >
                {c.status}
              </span>
              <span className="grow" />
              {!isDone && (
                <button
                  className="btn o sm"
                  onClick={() =>
                    onToggleCampaign(c.id, isRunning ? "pause" : "resume")
                  }
                >
                  {isRunning ? "Pause" : "Resume"}
                </button>
              )}
            </div>

            {/* Progress bar */}
            <div
              className="prog"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <i style={{ width: `${pct}%` }} />
            </div>

            {/* Metrics Row (kvr) */}
            <div className="kvr">
              <span>
                <b>{s.total}</b> borrowers
              </span>
              <span>
                <b>{s.calling}</b> on a call
              </span>
              <span>
                <b>{s.queued}</b> waiting
              </span>
              <span>
                <b>{s.promise}</b> answered / promised
              </span>
              <span>
                <b>{s.handoff}</b> need a human
              </span>
              <span>
                <b>{s.exhausted}</b> no answer after {c.maxAttempts || 3} tries
              </span>
            </div>

            {/* Metadata Footer */}
            <small className="mu">
              Retry after {c.retryHours || 4}h · {c.concurrency || 3} calls at
              once · {packName}
              {c.createdAt &&
                ` · Created: ${new Date(c.createdAt).toLocaleDateString()}`}
            </small>
          </section>
        );
      })}

      {/* Empty State */}
      {(!camps || camps.length === 0) && (
        <div className="card empty">
          No campaigns found on the server. Click "New campaign" to create one.
        </div>
      )}
    </div>
  );
};