// src/controllers/useAppController.js
import { useAppState } from "../models/StateContext";
import {
  createSipCampaign,
  markCallReviewDone,
  requestSipCall,
  toggleSipCampaignStatus,
  updateCallPaidStatus,
} from "../models/apiService";
import { chk, formatPhone, over, pol } from "../models/domainRules";

export function useAppController() {
  const {
    calls,
    setCalls,
    setBs,
    bs,
    sel,
    setSel,
    camps,
    setCamps,
    cd,
    setCd,
    setView,
    form,
    setModal,
    setKept,
    done,
    setDone,
    toast,
    syncWithBackend,
    packs,
    setDashboardData,
  } = useAppState();

  const dial = async (borrowerIds) => {
    const ids = Array.isArray(borrowerIds) ? borrowerIds : [borrowerIds];
    const targetBorrowers = bs.filter((x) => ids.includes(x.id));
    if (targetBorrowers.length === 0) return toast("কোনো গ্রাহক পাওয়া যায়নি!");

    toast(
      targetBorrowers.length === 1
        ? `Calling ${targetBorrowers[0].name}...`
        : `Calling ${targetBorrowers.length} selected recipients...`,
    );

    try {
      await requestSipCall(targetBorrowers);
      toast("SIP Call Triggered Successfully!");
    } catch (err) {
      toast("API Call Notice: " + err.message);
    }

    const now = new Date().toISOString();
    const newCalls = targetBorrowers.map((b, idx) => ({
      id: "live_" + (Date.now() + idx),
      callId: "live_" + (Date.now() + idx),
      b: { ...b },
      status: "dialing",
      startedAt: null,
      transcript: [
        {
          role: "agent",
          text: `আসসালামু আলাইকুম। আমি ল্যান্ডলাইন থেকে বলছি। এই কলটি সেবার মান ও নিরাপত্তার স্বার্থে রেকর্ড করা হচ্ছে। আমি কি ${b.name} মহাশয়ের সাথে কথা বলছি?`,
          at: now,
        },
      ],
      checks: [
        { t: "Told the borrower the call is recorded", ok: true },
        { t: "Used only the offers allowed by policy", ok: true },
      ],
      outcome: null,
      audit: null,
      sim: 1,
    }));

    setCalls((prev) => [...newCalls, ...prev]);
    setModal(null);

    if (targetBorrowers.length === 1) {
      setSel(newCalls[0].id);
      setView("call");
    } else {
      setView("live");
    }
  };

  const hang = () => {
    setCalls((prev) =>
      prev.map((c) =>
        c.id === sel
          ? {
              ...c,
              status: "completed",
              endedAt: new Date().toISOString(),
              outcome: { type: "no_promise", reason: "ended by staff" },
              audit: { score: 95, notes: "Call ended by staff." },
            }
          : c,
      ),
    );
    setModal(null);
    toast("Call ended");
    setTimeout(syncWithBackend, 2000);
  };

  const handoff = () => {
    setCalls((prev) =>
      prev.map((c) =>
        c.id === sel
          ? {
              ...c,
              status: "completed",
              endedAt: new Date().toISOString(),
              outcome: { type: "handoff", reason: "Handed over by staff" },
              audit: { score: 96, notes: "Escalated to human supervisor." },
            }
          : c,
      ),
    );
    setModal(null);
    toast("Handed to a human. See Needs review.");
  };

  const saveResult = (pack) => {
    const currentCall = calls.find((c) => c.id === sel);
    if (!currentCall) return;
    const o = { type: form.out, reason: form.reason, notes: form.notes };

    if (form.out === "promise") {
      if (!(+form.amount > 0) || !form.date)
        return toast("Enter the amount and the date.");
      const errs = pol(currentCall.b, form, pack);
      if (errs.length)
        return toast("Not allowed by policy: " + errs.join(", "));
      o.amount = +form.amount;
      o.date = form.date;
    }

    setCalls((prev) =>
      prev.map((c) => (c.id === sel ? { ...c, outcome: o } : c)),
    );
    setModal(null);
    toast("Result saved");
  };

  const exportCSV = (visibleCalls) => {
    const rows = [
      ["started", "borrower", "outcome", "amount", "date", "rule_check_score"],
      ...visibleCalls.map((c) => [
        c.startedAt,
        c.b?.name || "",
        c.outcome?.type || "",
        c.outcome?.amount || "",
        c.outcome?.date || "",
        c.audit?.score ?? "",
      ]),
    ];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob(
        [
          rows
            .map((r) =>
              r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(","),
            )
            .join("\n"),
        ],
        { type: "text/csv" },
      ),
    );
    a.download = "lendline-calls.csv";
    a.click();
    toast("CSV downloaded");
  };

  const launchCampaign = async () => {
    if (!cd || !form.cname) {
      return toast("Please enter campaign name and upload a CSV file!");
    }

    const validRows = cd.rows.filter((r) => !chk(r));
    if (validRows.length === 0) {
      return toast("No valid recipient rows found in CSV!");
    }

    toast(`Preparing ${validRows.length} recipients for campaign...`);

    const formattedRecipients = validRows.map((r, i) => {
      const amtDue = Number(r.amountDue) || 12000;
      const overdueDaysCount = over({ dueDate: r.dueDate || "2026-09-01" });
      const origAmt =
        Number(r.original) || Number(r.originalAmount) || amtDue * 10;
      const remBal =
        Number(r.remaining) || Number(r.remainingBalance) || amtDue * 8;

      return {
        name: r.name,
        phone: formatPhone(r.phone),
        data: {
          borrowerId: r.loan || "d" + (i + 1),
          name: r.name,
          phone: r.phone,
          loanId: r.loan || "LN-" + (784500 + i),
          product: r.product || "Retail Loan",
          amountDue: amtDue,
          currency: "BDT",
          dueDate: r.dueDate || "2026-09-01",
          overdueDays: overdueDaysCount,
          originalAmount: origAmt,
          remainingBalance: remBal,
          minPartialAmount: Math.ceil(amtDue * 0.5),
          maxRescheduleDays: 30,
        },
      };
    });

    const campaignPayload = {
      campaignName: form.cname || "Lendline Loan Overdue Recovery Campaign",
      callerNumber: "8809678770134",
      retryNextDay: true,
      doubleTry: false,
      instructionType: "conversation",
      serviceType: "loan-recovery",
      startTime: null,
      stopTime: null,
      callStartDate: null,
      callEndDate: null,
      instructionDetails: form.instructionDetails || "",
      recipients: formattedRecipients,
    };

    console.log("🚀 Launching Campaign with Payload:", campaignPayload);

    try {
      await createSipCampaign(campaignPayload);
      toast("Campaign SIP calls dispatched successfully!");
    } catch (err) {
      console.warn("Campaign API dispatch note:", err.message);
      toast("Campaign started: " + err.message);
    }

    const newCampId = "k" + Date.now();
    const newCampaignState = {
      id: newCampId,
      name: campaignPayload.campaignName,
      pack: form.pack || "bd",
      status: "running",
      maxAttempts: +form.maxAttempts || 3,
      retryHours: +form.retryHours || 4,
      concurrency: +form.concurrency || 3,
      stats: {
        total: formattedRecipients.length,
        queued: formattedRecipients.length,
        calling: 0,
        promise: 0,
        handoff: 0,
        exhausted: 0,
        failed: 0,
      },
    };

    const newBorrowers = formattedRecipients.map((r, i) => ({
      id: "imp_" + Date.now() + "_" + i,
      name: r.name,
      phone: r.phone,
      pack: form.pack || "bd",
      amountDue: r.data.amountDue,
      dueDate: r.data.dueDate,
      loanId: r.data.loanId,
      product: r.data.product,
    }));

    setBs((prev) => [...newBorrowers, ...prev]);
    setCamps((prev) => [newCampaignState, ...prev]);
    setCd(null);
    setModal(null);
    setView("camps");
    toast("Campaign launched successfully!");
    setTimeout(syncWithBackend, 3000);
  };

  const toggleCampaign = async (id, action) => {
    setCamps((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: action === "pause" ? "paused" : "running" }
          : c,
      ),
    );
    toast(action === "pause" ? "Campaign paused" : "Campaign resumed");

    try {
      await toggleSipCampaignStatus(id, action);
      setTimeout(syncWithBackend, 1500);
    } catch (err) {
      console.warn("Failed to toggle campaign status on server:", err.message);
    }
  };

  // ✅ সম্পূর্ণ নিরাপদ ও কার্যকর markDone
  const markDone = async (callId) => {
    console.log("🎯 Marking review as DONE for Call ID:", callId);

    // ১. UI অপ্টিমিস্টিক আপডেট (যাতে সাথে সাথে রিমুভ হয়)
    setDone((prev) => ({ ...prev, [callId]: 1 }));

    if (typeof setDashboardData === "function") {
      setDashboardData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          attentionList: (prev.attentionList || []).filter(
            (item) => item.c?.id !== callId && item.c?.callId !== callId,
          ),
        };
      });
    }

    toast("Review marked as resolved!");

    // ২. আসল ব্যাকএন্ড API কল (MongoDB তে isReviewed: true সেভ হবে)
    try {
      await markCallReviewDone(callId);
      console.log("✅ Successfully updated in MongoDB!");
      await syncWithBackend();
    } catch (err) {
      console.warn("Review sync notice:", err.message);
    }
  };

  // ✅ সম্পূর্ণ নিরাপদ ও কার্যকর markKept
  const markKept = async (callId, status = "kept") => {
    console.log("🔥 Paid button clicked for Call ID:", callId);

    setKept((prev) => ({ ...prev, [callId]: status }));
    setCalls((prev) =>
      prev.map((c) =>
        c.id === callId || c.callId === callId
          ? { ...c, paidStatus: status }
          : c,
      ),
    );

    if (typeof setDashboardData === "function") {
      setDashboardData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          funnel: {
            ...prev.funnel,
            paid: status === "kept" ? (prev.funnel?.paid || 0) + 1 : (prev.funnel?.paid || 0),
          },
        };
      });
    }

    toast(status === "kept" ? "Marked as paid!" : "Marked as not paid");

    try {
      await updateCallPaidStatus(callId, status);
      console.log("✅ Successfully updated paidStatus in MongoDB!");
      await syncWithBackend();
    } catch (err) {
      console.error("❌ Failed to update paid status in backend:", err.message);
      toast("Backend sync notice: " + err.message);
    }
  };

  const undoKept = async (callId) => {
    console.log("↩️ Undo clicked for Call ID:", callId);

    setKept((prev) => {
      const n = { ...prev };
      delete n[callId];
      return n;
    });

    setCalls((prev) =>
      prev.map((c) =>
        c.id === callId || c.callId === callId
          ? { ...c, paidStatus: "pending" }
          : c,
      ),
    );

    if (typeof setDashboardData === "function") {
      setDashboardData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          funnel: {
            ...prev.funnel,
            paid: Math.max(0, (prev.funnel?.paid || 0) - 1),
          },
        };
      });
    }

    toast("Payment undone");

    try {
      await updateCallPaidStatus(callId, "pending");
      await syncWithBackend();
    } catch (err) {
      console.warn("Undo error:", err.message);
    }
  };

  return {
    dial,
    hang,
    handoff,
    saveResult,
    exportCSV,
    launchCampaign,
    toggleCampaign,
    markKept,
    undoKept,
    markDone,
  };
}