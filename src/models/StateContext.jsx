// src/models/StateContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import {
  fetchLendlineDashboardData,
  groupCallsIntoCampaigns,
} from "./apiService";
import { F0 } from "./constants";
import { socket } from "./socketService";

const StateContext = createContext();

export const StateProvider = ({ children }) => {
  const [bs, setBs] = useState([
    {
      id: "d1",
      name: "Jubayer Ahamed",
      phone: "+8801713454223",
      pack: "bd",
      amountDue: 6500,
      dueDate: "2026-10-01",
      loanId: "LN-210993",
      product: "Retail Loan",
    },
    {
      id: "d2",
      name: "Rajesh Khoksi",
      phone: "+8801714121645",
      pack: "bd",
      amountDue: 9000,
      dueDate: "2026-09-10",
      loanId: "LN-118276",
      product: "Personal Loan",
    },
    {
      id: "d3",
      name: "Aidose",
      phone: "+8801624237479",
      pack: "bd",
      amountDue: 12000,
      dueDate: "2026-09-01",
      loanId: "LN-784512",
      product: "Retail Loan",
    },
    {
      id: "d5",
      name: "Maria Santos",
      phone: "+8801713454223",
      pack: "b",
      amountDue: 2500,
      dueDate: "2026-10-02",
      loanId: "LN-300118",
      product: "Retail Loan",
    },
  ]);

  const [packs] = useState([
    {
      id: "bd",
      name: "Bangladesh (BN)",
      lang: "Bangla",
      language: "Bangla",
      status: "Ready",
      limits: { maxRescheduleDays: 30, minPartialPct: 50 },
      disclosure:
        "This call is recorded. I am an AI assistant calling on behalf of Lendline about your loan installment.",
      banned: [
        "threats",
        "shaming",
        "telling third parties about the debt",
        "false urgency or pressure",
      ],
      hours: [9, 20],
    },
    {
      id: "b",
      name: "Market B (illustrative)",
      lang: "Tagalog/English",
      language: "Tagalog and English",
      status: "In Review",
      limits: { maxRescheduleDays: 10, minPartialPct: 50 },
      disclosure:
        "This call is recorded. I am an AI assistant calling for Lendline about your loan payment.",
      banned: [
        "threats",
        "shaming",
        "telling third parties about the debt",
        "repeated pressure",
      ],
      hours: [8, 19],
    },
    {
      id: "id",
      name: "Indonesia (ID)",
      lang: "Bahasa",
      status: "Draft",
    },
    {
      id: "in",
      name: "India (IN)",
      lang: "Hindi",
      status: "Draft",
    },
  ]);

  const [calls, setCalls] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [view, setView] = useState("today");
  const [sel, setSel] = useState(null);
  const [mkt, setMkt] = useState("bd");
  const [tr, setTr] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ ...F0 });
  const [kept, setKept] = useState({});
  const [done, setDone] = useState({});
  const [q, setQ] = useState("");
  const [fil, setFil] = useState("all");
  const [name, setName] = useState("Jobayer Ahmed");
  const [toastMsg, setToastMsg] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [camps, setCamps] = useState([]);
  const [cd, setCd] = useState(null);

  const [aiConfig, setAiConfig] = useState(() => {
    const saved = localStorage.getItem("lendline_ai_config");
    return saved
      ? JSON.parse(saved)
      : {
          callerNumber: "8809678770134",
          model: "models/gemini-3.8-live",
          languageCode: "bn-BD",
          voiceName: "Zubenelgenubi",
          pipelineType: "multimodal_live",
        };
  });

  const updateAiConfig = (newConfig) => {
    const updated = { ...aiConfig, ...newConfig };
    setAiConfig(updated);
    localStorage.setItem("lendline_ai_config", JSON.stringify(updated));
  };

  const toast = (msg) => {
    setToastMsg(msg);
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => setToastMsg(""), 3000);
  };

  useEffect(() => {
    socket.on("call_connected", (data) => {
      console.log("☎️ [Socket] Customer Answered Phone:", data);
      toast("Customer answered! Call is now LIVE.");

      setCalls((prev) =>
        prev.map((c) => {
          if (c.status === "dialing") {
            return {
              ...c,
              callId: String(data.callId || data.handleId),
              status: "live",
              startedAt: data.startTime || new Date().toISOString(),
            };
          }
          return c;
        }),
      );
    });

    socket.on("call_ended", (data) => {
      console.log("📴 [Socket] Customer Disconnected:", data);
      toast("Customer hung up! Processing transcript...");

      setCalls((prev) =>
        prev.map((c) => {
          const isTarget =
            c.status === "live" ||
            c.status === "dialing" ||
            c.callId === String(data.callId || data.handleId);

          if (isTarget) {
            return {
              ...c,
              status: "processing",
              endedAt: data.endedAt || new Date().toISOString(),
              durationSeconds: data.durationSeconds || c.durationSeconds,
            };
          }
          return c;
        }),
      );
    });

    socket.on("call_analyzed", (payload) => {
      console.log("🎉 [Socket] Call Analyzed:", payload);
      toast("Call analysis & transcript ready!");

      const callId = String(payload.callId);
      const data = payload.data || {};

      setCalls((prev) => {
        let matched = false;
        const updated = prev.map((c) => {
          if (
            c.status === "processing" ||
            c.callId === callId ||
            c.id === callId
          ) {
            matched = true;
            return {
              ...c,
              ...data,
              id: c.id,
              callId: callId,
              status: "completed",
              b: data.b || data.borrower || c.b,
              transcript: data.transcript || data.transcripts || [],
            };
          }
          return c;
        });

        if (!matched && data.callId) {
          return [
            { id: data.callId, ...data, status: "completed" },
            ...updated,
          ];
        }
        return updated;
      });

      syncWithBackend();
    });

    return () => {
      socket.off("call_connected");
      socket.off("call_ended");
      socket.off("call_analyzed");
    };
  }, []);

  const syncWithBackend = async () => {
    const data = await fetchLendlineDashboardData();
    if (data) {
      setIsConnected(true);
      setDashboardData(data);

      const callsList = data.allCalls || data.recentCalls || [];

      if (Array.isArray(callsList)) {
        setCalls((prev) => {
          const formattedBackendCalls = callsList.map((c) => ({
            id: c.callId || c._id,
            callId: c.callId,
            b: c.b || c.borrower,
            status: c.status || "completed",
            startedAt: c.startedAt,
            endedAt: c.endedAt,
            durationSeconds: c.durationSeconds || 0,
            transcript: c.transcripts || c.transcript || [],
            outcome: c.outcome || null,
            audit: c.audit || null,
            checks: c.checks || [],
            stageReached: c.stageReached || "Confirmation",
            aiSummary: c.aiSummary || "",
            paidStatus: c.paidStatus || "pending",
          }));

          const activeLocalCalls = prev.filter(
            (c) =>
              c.status === "dialing" ||
              c.status === "live" ||
              c.status === "processing",
          );

          const activeIds = new Set(
            activeLocalCalls.map((x) => x.callId || x.id),
          );
          const nonDuplicates = formattedBackendCalls.filter(
            (x) => !activeIds.has(x.callId) && !activeIds.has(x.id),
          );

          return [...activeLocalCalls, ...nonDuplicates];
        });
      }

      if (Array.isArray(data.campaigns) && data.campaigns.length > 0) {
        setCamps(data.campaigns);
      } else if (
        Array.isArray(data.recentCalls) &&
        data.recentCalls.length > 0
      ) {
        const grouped = groupCallsIntoCampaigns(data.recentCalls);
        if (grouped.length > 0) setCamps(grouped);
      }
    } else {
      setIsConnected(false);
    }
  };

  useEffect(() => {
    syncWithBackend();
    const timer = setInterval(syncWithBackend, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <StateContext.Provider
      value={{
        bs,
        setBs,
        packs,
        calls,
        setCalls,
        dashboardData,
        setDashboardData,
        view,
        setView,
        sel,
        setSel,
        mkt,
        setMkt,
        tr,
        setTr,
        modal,
        setModal,
        form,
        setForm,
        kept,
        setKept,
        done,
        setDone,
        q,
        setQ,
        fil,
        setFil,
        name,
        setName,
        toastMsg,
        toast,
        isConnected,
        syncWithBackend,
        camps,
        setCamps,
        cd,
        setCd,
        aiConfig,
        updateAiConfig,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useAppState = () => useContext(StateContext);
