import { formatPhone, over } from "./domainRules";

export const APP_ID = import.meta.env?.VITE_APP_ID;
export const BASE_URL = import.meta.env?.VITE_BASE_URL;
const USERNAME = import.meta.env?.VITE_USERNAME || "test-client";
const PASSWORD = import.meta.env?.VITE_PASSWORD || "test-client";
const DID_NUMBER = import.meta.env?.VITE_DID || "+8809678771744";

const getBasicAuthCredentials = () => btoa(`${USERNAME}:${PASSWORD}`);

export async function fetchLendlineDashboardData(appId = APP_ID) {
  try {
    const res = await fetch(
      `${BASE_URL}/api/basic/v2.0.0/lendline/campaigns/${appId}`,
    );
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.warn("Backend API not reachable, using fallback:", err.message);
    return null;
  }
}

export async function fetchCallDetailById(callId) {
  const res = await fetch(
    `${BASE_URL}/api/basic/v2.0.0/lendline/calls/${callId}`,
  );
  const json = await res.json();
  if (!json.status) throw new Error(json.message);
  return json.data;
}

export function groupCallsIntoCampaigns(calls = []) {
  if (!Array.isArray(calls) || calls.length === 0) return [];
  const map = {};

  calls.forEach((c) => {
    const campId = c.campaignId || "direct_campaign";
    if (!map[campId]) {
      const b = c.b || c.borrower || {};
      map[campId] = {
        id: campId,
        campaignId: campId,
        name:
          c.campaignName ||
          (b.product
            ? `${b.product} Recovery Campaign`
            : "goBank Loan Overdue Recovery Campaign"),
        status: "completed",
        createdAt: c.createdAt || c.startedAt || new Date().toISOString(),
        pack: b.pack || "bd",
        retryHours: 4,
        concurrency: 3,
        stats: {
          total: 0,
          calling: 0,
          queued: 0,
          promise: 0,
          handoff: 0,
          exhausted: 0,
          failed: 0,
        },
      };
    }

    const camp = map[campId];
    camp.stats.total += 1;

    const callTime = new Date(c.createdAt || c.startedAt || 0).getTime();
    if (callTime > new Date(camp.createdAt).getTime()) {
      camp.createdAt = c.createdAt || c.startedAt;
    }

    if (
      c.status === "live" ||
      c.status === "dialing" ||
      c.status === "calling"
    ) {
      camp.status = "running";
      camp.stats.calling += 1;
    } else if (c.outcome?.type === "promise") {
      camp.stats.promise += 1;
    } else if (c.outcome?.type === "handoff") {
      camp.stats.handoff += 1;
    } else {
      camp.stats.exhausted += 1;
      camp.stats.failed += 1;
    }
  });

  return Object.values(map).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function fetchRealSipCampaigns(appId = APP_ID) {
  try {
    const data = await fetchLendlineDashboardData(appId);
    if (!data) return [];

    if (Array.isArray(data.campaigns) && data.campaigns.length > 0) {
      return data.campaigns;
    }

    if (Array.isArray(data.recentCalls) && data.recentCalls.length > 0) {
      return groupCallsIntoCampaigns(data.recentCalls);
    }

    return [];
  } catch (err) {
    console.warn("Failed to fetch campaigns:", err.message);
    return [];
  }
}

// ২. SIP Outbound Call Request API
export async function requestSipCall(borrowers) {
  const list = Array.isArray(borrowers) ? borrowers : [borrowers];

  const recipients = list.map((b) => ({
    name: b.name,
    phone: formatPhone(b.phone),
    data: {
      borrowerId: b.id,
      name: b.name,
      phone: b.phone,
      loanId: b.loanId || b.loan || "LN-784512",
      product: b.product || "Retail Loan",
      amountDue: b.amountDue || 14000,
      currency: "BDT",
      dueDate: b.dueDate || "2026-09-01",
      overdueDays: over(b),
      remainingBalance: b.remaining || b.amountDue || 14000,
      minPartialAmount: Math.ceil(((b.amountDue || 14000) * 50) / 100),
      maxRescheduleDays: 30,
    },
  }));

  const payload = {
    campaignName: "goBank Loan Overdue Recovery Campaign",
    callerNumber: DID_NUMBER,
    retryNextDay: true,
    doubleTry: false,
    instructionType: "conversation",
    serviceType: "loan-recovery",
    startTime: null,
    stopTime: null,
    callStartDate: null,
    callEndDate: null,
    instructionDetails: `You are 'goBank AI' calling regarding overdue loan installments. State recording disclosure, verify identity, explain amount due, negotiate within policy limits (max 30 days, min 50% partial), and teach-back confirm.`,
    recipients,
  };

  const res = await fetch(
    `${BASE_URL}/api/basic/v2.0.0/sip/call/request/${APP_ID}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${getBasicAuthCredentials()}`,
      },
      body: JSON.stringify(payload),
    },
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(data.message || data.error || `HTTP Error ${res.status}`);
  return data;
}

export async function createSipCampaign(payload) {
  const res = await fetch(
    `${BASE_URL}/api/basic/v2.0.0/sip/call/request/${APP_ID}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${getBasicAuthCredentials()}`,
      },
      body: JSON.stringify(payload),
    },
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(data.message || data.error || `HTTP Error ${res.status}`);
  return data;
}

export async function toggleSipCampaignStatus(
  campaignId,
  action,
  appId = APP_ID,
) {
  const url = `${BASE_URL}/api/campaigns/v1/${appId}/sip/${campaignId}?action=${action}`;
  const token = localStorage.getItem("token") || "";

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({}),
  });

  return res.json().catch(() => ({}));
}

export async function updateCallPaidStatus(callId, paidStatus) {
  const url = `${BASE_URL}/api/basic/v2.0.0/lendline/calls/${callId}/paid-status`;

  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paidStatus }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
    return json.data;
  } catch (err) {
    console.error("❌ Failed to update paid status in backend:", err.message);
    throw err;
  }
}

export async function markCallReviewDone(callId) {
  const url = `${BASE_URL}/api/basic/v2.0.0/lendline/calls/${callId}/review-done`;
  console.log(`📡 [API] Sending PUT request to: ${url}`);

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
  return json.data;
}

export async function assignSipVoiceAi(config) {
  const url = `${BASE_URL}/api/basic/v2.0.0/sip-credentials/assign`;

  const payload = {
    app_id: config.appId || APP_ID,
    sipNumber: String(config.callerNumber || "+8809678770134").trim(),
    aiModels: {
      voice: {
        pipelineType: config.pipelineType || "multimodal_live",
        provider: "gemini",
        model: config.model || "models/gemini-3.8-live",
        voiceId: config.voiceName || config.voiceId || "Zubenelgenubi",
        languageCode: config.languageCode || "bn-BD",
      },
    },
  };

  console.log("🚀 Assigning Voice AI to SIP DID:", payload);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${getBasicAuthCredentials()}`,
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message || json.error || `HTTP ${res.status}`);
  }
  return json;
}
