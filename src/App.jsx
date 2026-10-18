// src/App.jsx
import { useAppController } from "./controllers/useAppController";
import { useAppState } from "./models/StateContext";

import { Modals } from "./views/components/Modals";
import { Sidebar } from "./views/components/Sidebar";

import { F0 } from "./models/constants";
import { CallDetailView } from "./views/CallDetailView";
import { CallsListView } from "./views/CallsListView";
import { CampaignsView } from "./views/CampaignsView";
import { DashboardView } from "./views/DashboardView";
import { FollowupsView } from "./views/FollowupsView";
import { LiveWallView } from "./views/LiveWallView";
import { ReviewView } from "./views/ReviewView";
import { SettingsView } from "./views/SettingsView";

export default function App() {
  const {
    view,
    setView,
    packs,
    mkt,
    setMkt,
    setModal,
    setSel,
    setForm,
    toastMsg,
    calls,
  } = useAppState();
  const controller = useAppController();

  const handleOpenCall = (callId) => {
    setSel(callId);
    setView("call");
  };

  const handleStartCallModal = (borrowerId) => {
    setModal({ t: "start", id: borrowerId });
  };

  const handleOpenEditModal = () => {
    const current = calls.find((c) => c.id === sel || c.callId === sel);
    if (!current) return;
    const o = current.outcome;
    setForm({
      ...F0,
      out:
        o?.type === "handoff" || o?.type === "no_promise" ? o.type : "promise",
      amount: o?.amount || "",
      date: o?.date || "",
      reason: o?.reason || "financial_difficulty",
      notes: o?.notes || "",
    });
    setModal({ t: "edit" });
  };

  return (
    <div className="app">
      <Sidebar />
      <main>
        {/* Top Market Selector */}
        <div className="top">
          <label className="mu" htmlFor="mk">
            Market
          </label>
          <select id="mk" value={mkt} onChange={(e) => setMkt(e.target.value)}>
            {packs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {view === "today" && (
          <DashboardView
            onCall={handleStartCallModal}
            onCallMultiple={(ids) => controller.dial(ids)}
            onOpenCall={handleOpenCall}
            onDoneItem={controller.markDone}
          />
        )}

        {view === "call" && (
          <CallDetailView
            onHangup={() => setModal({ t: "end" })}
            onHandoff={() => setModal({ t: "hand" })}
            onOpenEdit={handleOpenEditModal}
          />
        )}

        {view === "calls" && (
          <CallsListView
            onOpenCall={handleOpenCall}
            onExport={controller.exportCSV}
          />
        )}

        {view === "live" && (
          <LiveWallView
            onOpenCall={handleOpenCall}
            onEndCall={(callId) => {
              setSel(callId);
              setModal({ t: "end" });
            }}
          />
        )}

        {view === "follow" && (
          <FollowupsView
            onKept={controller.markKept}
            onUndo={controller.undoKept}
            onCallAgain={handleStartCallModal}
          />
        )}

        {view === "review" && (
          <ReviewView
            onOpenCall={handleOpenCall}
            onDoneItem={controller.markDone}
          />
        )}

        {view === "camps" && (
          <CampaignsView
            onNewCampaign={() => {
              setForm({ ...F0, cname: "", pack: mkt });
              setModal({ t: "camp" });
            }}
            onToggleCampaign={() => {}}
          />
        )}

        {view === "set" && <SettingsView />}

        {view === "camps" && (
          <CampaignsView
            onNewCampaign={() => {
              setForm({
                ...F0,
                cname: "",
                pack: mkt,
                maxAttempts: 3,
                retryHours: 4,
                concurrency: 3,
              });
              setCd(null);
              setModal({ t: "camp" });
            }}
            onToggleCampaign={controller.toggleCampaign}
          />
        )}
      </main>

      <Modals
        onStartCall={controller.dial}
        onEndCall={controller.hang}
        onHandoffCall={controller.handoff}
        onSaveResult={controller.saveResult}
        onLaunchCampaign={controller.launchCampaign}
      />

      <div id="toast" className={toastMsg ? "on" : ""} role="status">
        {toastMsg}
      </div>
    </div>
  );
}
