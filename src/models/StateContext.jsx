// src/models/StateContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import {
  fetchLendlineDashboardData,
  groupCallsIntoCampaigns,
} from "./apiService";
import { F0 } from "./constants";

const StateContext = createContext();

export const StateProvider = ({ children }) => {
  const [bs, setBs] = useState([
    {
      id: "d1",
      name: "Jahanara Khatun",
      phone: "+8801714121645",
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
      name: "Rafiqul Biswas",
      phone: "+880 1714 121645",
      pack: "bd",
      amountDue: 12000,
      dueDate: "2026-09-01",
      loanId: "LN-784512",
      product: "Retail Loan",
    },
    {
      id: "d4",
      name: "Shamima Akter",
      phone: "+880 1714 121645",
      pack: "bd",
      amountDue: 3500,
      dueDate: "2026-10-05",
      loanId: "LN-662910",
      product: "Retail Loan",
    },
  ]);

  const [packs] = useState([
    {
      id: "bd",
      name: "Bangladesh (BN)",
      lang: "Bangla",
      status: "Ready",
      limits: { maxRescheduleDays: 30, minPartialPct: 50 },
      disclosure:
        "This call is recorded. I am an AI assistant calling on behalf of Lendline.",
      banned: [
        "threats",
        "shaming",
        "telling third parties about the debt",
        "false urgency",
      ],
      hours: [9, 20],
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

  const syncWithBackend = async () => {
    const data = await fetchLendlineDashboardData();
    if (data) {
      setIsConnected(true);
      setDashboardData(data);

      const callsList = data.allCalls || data.recentCalls || [];

      if (Array.isArray(callsList)) {
        setCalls((prev) => {
          const formattedCalls = callsList.map((c) => ({
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

          const liveLocals = prev.filter((p) => p.status === "live");
          const existingIds = new Set(liveLocals.map((x) => x.id));
          const nonDuplicates = formattedCalls.filter(
            (x) => !existingIds.has(x.id),
          );
          return [...liveLocals, ...nonDuplicates];
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
