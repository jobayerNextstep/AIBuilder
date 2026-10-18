import { addDays } from "./domainRules";

export const DB = [
  { id: "d1", name: "Rafiqul Biswas", phone: "+880 1714 121645", pack: "bd", amountDue: 12000, dueDate: "2026-09-01", loan: "LN-784512", original: 120000, remaining: 98450, product: "Retail Loan" },
  { id: "d2", name: "Shamima Akter", phone: "+880 1714 121645", pack: "bd", amountDue: 3500, dueDate: "2026-10-05", loan: "LN-662910", original: 42000, remaining: 21000, product: "Retail Loan" },
  { id: "d3", name: "Md. Hasan", phone: "+880 1714 121645", pack: "bd", amountDue: 8000, dueDate: "2026-09-20", loan: "LN-551204", original: 80000, remaining: 56000, product: "Personal Loan" },
  { id: "d4", name: "Maria Santos", phone: "+880 1714 121645", pack: "b", amountDue: 2500, dueDate: "2026-10-02", loan: "LN-300118", original: 30000, remaining: 17500, product: "Retail Loan" },
  { id: "d5", name: "Nasrin Sultana", phone: "+880 1714 121645", pack: "bd", amountDue: 5000, dueDate: "2026-09-25", loan: "LN-440871", original: 50000, remaining: 35000, product: "Retail Loan" },
  { id: "d6", name: "Rajesh Khoksi", phone: "+880 1714 121645", pack: "bd", amountDue: 15000, dueDate: "2026-08-30", loan: "LN-390442", original: 150000, remaining: 120000, product: "Personal Loan" },
  // { id: "d7", name: "Jahanara Khatun", phone: "+880 1744 556677", pack: "bd", amountDue: 6500, dueDate: "2026-10-01", loan: "LN-210993", original: 65000, remaining: 48000, product: "Retail Loan" },
  // { id: "d8", name: "Abdul Karim", phone: "+880 1833 441122", pack: "bd", amountDue: 9000, dueDate: "2026-09-10", loan: "LN-118276", original: 90000, remaining: 72000, product: "Personal Loan" },
];

export const DP = [
  {
    id: "bd",
    name: "Bangladesh (BN)",
    lang: "Bangla",
    language: "Bangla",
    status: "Ready",
    version: "v1.2.0",
    tz: "Asia/Dhaka",
    hours: [9, 20],
    currency: "taka",
    disclosure: "This call is recorded. I am an AI assistant calling on behalf of {{lender}} about your loan installment.",
    banned: ["threats", "shaming", "telling third parties about the debt", "false urgency or pressure"],
    limits: { maxRescheduleDays: 30, minPartialPct: 50 },
  },
  {
    id: "b",
    name: "Market B (illustrative)",
    lang: "Tagalog/English",
    language: "Tagalog and English",
    status: "In Review",
    version: "v0.9.0",
    tz: "Asia/Manila",
    hours: [8, 19],
    currency: "pesos",
    disclosure: "This call is recorded. I am an AI assistant calling for {{lender}} about your loan payment.",
    banned: ["threats", "shaming", "telling third parties about the debt", "repeated pressure"],
    limits: { maxRescheduleDays: 10, minPartialPct: 50 },
  },
  { id: "id", name: "Indonesia (ID)", lang: "Bahasa", status: "Draft", version: "v0.9.1" },
  { id: "in", name: "India (IN)", lang: "Hindi", status: "Draft", version: "v0.8.0" },
];

export const SC = [
  ["agent", "আসসালামু আলাইকুম, আমি লেন্ডলাইন থেকে বলছি। এই কলটি রেকর্ড করা হচ্ছে। আপনি কি এখন কথা বলতে পারবেন?", "Assalamu alaikum, I am calling from Lendline. This call is recorded. Can you talk now?"],
  ["borrower", "জি, বলতে পারি।", "Yes, I can talk."],
  ["agent", "ধন্যবাদ। আমি কি আপনার পুরো নামটি জানতে পারি?", "Thank you. May I know your full name?"],
  ["borrower", "জি, আমিই বলছি।", "Yes, this is me speaking."],
  ["agent", "ধন্যবাদ। আপনার কিস্তির সময়সীমা পার হয়ে গেছে। কোনো সমস্যা হচ্ছে কি?", "Thank you. Your installment is overdue. Is there a problem?"],
  ["borrower", "চাকরি চলে গেছে। আগামী মাসে দিতে পারব।", "I lost my job. I can pay next month."],
  ["agent", "বুঝতে পারছি। আপনি এক মাস সময় পেতে পারেন। পুরো কিস্তি দিলে চলবে?", "I understand. You can have one month. Would paying the full installment work?"],
  ["borrower", "জি, চলবে।", "Yes, that works."],
  ["agent", "আপনি নিজের কথায় বলবেন কি, কত টাকা কবে দেবেন?", "Please say in your own words how much you will pay and when."],
  ["borrower", "পুরো কিস্তি, এক মাস পরে।", "The full installment, in one month."],
  ["agent", "ধন্যবাদ। আপনার প্রতিশ্রুতি নথিভুক্ত হয়েছে। ভালো থাকবেন।", "Thank you. Your promise is recorded. Take care."],
];

export const CK = {
  0: "Disclosure played",
  6: "Offers fetched from policy engine",
  9: "Promise within policy, teach-back confirmed",
};

export function getInitialDemoState() {
  const n = Date.now();
  const L2 = [
    ["agent", "This call is recorded. I am an AI assistant calling about your loan installment."],
    ["borrower", "I understand. I can pay next week."],
  ];
  const H = (id, b, m, o, sc, iss, ls, notes) => {
    const s = n - m * 6e4;
    return {
      id,
      borrowerId: b.id,
      b: { ...b },
      status: "ended",
      startedAt: new Date(s).toISOString(),
      endedAt: new Date(s + 18e4).toISOString(),
      transcript: ls.map((l, i) => ({ role: l[0], text: l[1], at: s + i * 12e3 })),
      checks: [],
      outcome: o,
      audit: {
        score: sc,
        disclosure_given: true,
        banned_behavior: [],
        offers_outside_policy: iss,
        teach_back_done: o.type === "promise",
        notes,
      },
    };
  };

  const initialCalls = [
    {
      id: "c9",
      borrowerId: "d1",
      b: { ...DB[0] },
      status: "live",
      startedAt: new Date(n - 5e4).toISOString(),
      transcript: SC.slice(0, 4).map((x, i) => ({ role: x[0], text: x[1], en: x[2], at: n - 5e4 + i * 1e4 })),
      checks: [{ t: CK[0], ok: true, at: n - 5e4 }],
      outcome: null,
      audit: null,
      sim: 4,
    },
    H("h1", DB[1], 12, { type: "handoff", reason: "illness" }, 96, [], [
      ["agent", "This call is recorded. I am an AI assistant calling about your loan installment."],
      ["borrower", "My mother is in hospital. I cannot talk about this now."],
      ["agent", "I am sorry to hear that. A human officer will call you back."],
    ], "Escalated correctly after the borrower mentioned illness."),
    H("h2", DB[2], 28, { type: "promise", amount: 8000, date: addDays(10), reason: "forgot" }, 94, [], L2, "Compliant call."),
    H("h3", DB[3], 55, { type: "promise", amount: 2500, date: addDays(7), reason: "income_timing" }, 82, [], L2, "The offer was repeated three times. Review the tone."),
    H("h4", DB[1], 180, { type: "no_promise", reason: "dispute" }, 64, ["Mentioned a fee waiver that is not in the policy pack"], L2, "Offered something outside the policy pack."),
    {
      id: "c8",
      borrowerId: DB[4].id,
      b: { ...DB[4] },
      status: "live",
      startedAt: new Date(n - (2 * 1e4 + 3e4)).toISOString(),
      transcript: SC.slice(0, 2).map((x, i) => ({ role: x[0], text: x[1], en: x[2], at: n - (2 * 1e4 + 3e4) + i * 1e4 })),
      checks: [{ t: CK[0], ok: true, at: n - 3e4 }],
      outcome: null,
      audit: null,
      sim: 2,
    },
    {
      id: "c7",
      borrowerId: DB[5].id,
      b: { ...DB[5] },
      status: "live",
      startedAt: new Date(n - (7 * 1e4 + 3e4)).toISOString(),
      transcript: SC.slice(0, 7).map((x, i) => ({ role: x[0], text: x[1], en: x[2], at: n - (7 * 1e4 + 3e4) + i * 1e4 })),
      checks: [{ t: CK[0], ok: true, at: n - 3e4 }],
      outcome: null,
      audit: null,
      sim: 7,
    },
  ];

  const CA = [48, 62, 71, 55, 80, 92, 60, 66, 74, 85, 90, 64, 70, 38];
  const PR = [22, 30, 36, 27, 41, 50, 30, 35, 40, 47, 52, 34, 39, 17];
  const hist = CA.map((c, i) => ({
    calls: c,
    ans: Math.round(c * 0.8),
    prom: PR[i],
    kept: Math.round(PR[i] * 0.7),
    val: PR[i] * (6000 + i * 110),
    esc: Math.round(c * 0.06),
    score: 94 + ((i * 3) % 5),
  }));

  const camps = [
    {
      id: "k1",
      name: "Early reminders: retail loans",
      pack: "bd",
      status: "running",
      maxAttempts: 3,
      retryHours: 4,
      concurrency: 3,
      stats: { total: 220, queued: 82, calling: 3, promise: 61, handoff: 7, exhausted: 12, failed: 0 },
    },
    {
      id: "k2",
      name: "Soft follow-up, 1 to 30 days late",
      pack: "bd",
      status: "paused",
      maxAttempts: 3,
      retryHours: 6,
      concurrency: 2,
      stats: { total: 90, queued: 90, calling: 0, promise: 0, handoff: 0, exhausted: 0, failed: 0 },
    },
  ];

  return { bs: DB, packs: DP, calls: initialCalls, hist, camps };
}