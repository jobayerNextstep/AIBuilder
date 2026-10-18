// src/models/domainRules.js

export const fmt = (n) => Number(n || 0).toLocaleString("en-US");
export const tk = (n) => "৳" + fmt(n);
export const ini = (n) =>
  String(n || "")
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("");

export const addDays = (n) =>
  new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

export const dsh = (s) =>
  new Date(s).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const ago = (t) => {
  const m = Math.round((Date.now() - new Date(t)) / 6e4);
  return m < 1
    ? "just now"
    : m < 60
      ? m + "m ago"
      : m < 1440
        ? Math.round(m / 60) + "h ago"
        : Math.round(m / 1440) + "d ago";
};

export const over = (b) =>
  Math.max(
    0,
    Math.floor((Date.now() - new Date(b?.dueDate || Date.now())) / 864e5),
  );

export const mmss = (a, z) => {
  const s = Math.max(
    0,
    Math.round(((z ? new Date(z) : Date.now()) - new Date(a)) / 1e3),
  );
  return (
    String(Math.floor(s / 60)).padStart(2, "0") +
    ":" +
    String(s % 60).padStart(2, "0")
  );
};

export const formatPhone = (phone) => {
  let cleaned = String(phone || "").replace(/[\s-]/g, "");
  if (cleaned.startsWith("+88")) cleaned = cleaned.replace("+88", "");
  if (cleaned.startsWith("880")) cleaned = cleaned.substring(2);
  return cleaned;
};

export const isLive = (c) =>
  c && (c.status === "live" || c.status === "dialing");

export function stepOf(c) {
  const t = c?.transcript || c?.transcripts || [];
  const bt = t.filter((x) => x.role === "borrower").length;
  const ck = (c?.checks || []).map((k) => k.t).join("|");
  let s = 0;
  if (t.length >= 1) s = 1;
  if (bt >= 2) s = 2;
  if (bt >= 3) s = 3;
  if (/Offers fetched/.test(ck)) s = Math.max(s, 4);
  if (bt >= 4) s = Math.max(s, 5);
  if (bt >= 5 || /teach-back confirmed/.test(ck)) s = 6;
  if (c?.status === "completed" || c?.status === "ended") s = 7;
  return s;
}

export const plain = (t) =>
  /Disclosure/.test(t)
    ? "Told the borrower the call is recorded"
    : /Offers fetched/.test(t)
      ? "Used only the offers allowed by policy"
      : /rejected/.test(t)
        ? "Blocked a promise that was outside the rules"
        : /teach-back confirmed/.test(t)
          ? "Borrower confirmed the amount and date"
          : /^Escalated/.test(t)
            ? "Handed to a human: " + t.replace(/^Escalated:\s*/, "")
            : t;

export const verdict = (a) =>
  !a
    ? ["", "Checking…"]
    : a.score >= 90
      ? ["g", "Passed"]
      : a.score >= 70
        ? ["y", "Needs review"]
        : ["r", "Failed"];

export const resTxt = (o) =>
  !o
    ? "No result yet"
    : o.type === "promise"
      ? `Promised ${tk(o.amount)} by ${dsh(o.date)}`
      : o.type === "handoff"
        ? "Needs a human callback"
        : o.type === "callback"
          ? "Call back later"
          : "No promise made";

export function offers(c, pack) {
  const L = (pack || { limits: { maxRescheduleDays: 30, minPartialPct: 50 } })
    .limits;
  const b = c?.b || c?.borrower || { amountDue: 14000 };
  return [
    { amt: b.amountDue, date: addDays(L.maxRescheduleDays) },
    {
      amt: Math.ceil((b.amountDue * L.minPartialPct) / 100),
      date: addDays(Math.ceil(L.maxRescheduleDays / 2)),
    },
  ];
}

export const offerTxt = (c, pack) => {
  const o = offers(c, pack);
  return [
    `Pay the full ${tk(o[0].amt)} by ${dsh(o[0].date)}`,
    `Pay at least ${tk(o[1].amt)} now and the rest by ${dsh(o[1].date)}`,
  ];
};

export const pol = (b, f, pack) => {
  const L = (pack || { limits: { maxRescheduleDays: 30, minPartialPct: 50 } })
    .limits;
  const e = [];
  if (+f.amount > b.amountDue)
    e.push(`amount is above what is due (${tk(b.amountDue)})`);
  if (+f.amount < Math.ceil((b.amountDue * L.minPartialPct) / 100)) {
    e.push(
      `amount is below the minimum (${tk(Math.ceil((b.amountDue * L.minPartialPct) / 100))})`,
    );
  }
  if ((new Date(f.date) - Date.now()) / 864e5 > L.maxRescheduleDays) {
    e.push(`date is more than ${L.maxRescheduleDays} days away`);
  }
  return e;
};

export const chk = (r) =>
  !r.name
    ? "name is missing"
    : !/^\+\d{8,15}$/.test(String(r.phone || "").replace(/[\s-]/g, ""))
      ? "phone must start with + and the country code"
      : !(+r.amountDue > 0)
        ? "amountDue is not a number"
        : isNaN(new Date(r.dueDate))
          ? "dueDate is not a date"
          : !/^(1|true|yes|y)$/i.test(String(r.consent || "").trim())
            ? "no consent recorded"
            : "";

export function parseCsvText(t) {
  const L = t
    .replace(/\r/g, "")
    .split("\n")
    .filter((x) => x.trim());
  const sp = (l) => {
    const o = [];
    let c = "",
      q = 0;
    for (const ch of l) {
      if (ch === '"') q = !q;
      else if (ch === "," && !q) {
        o.push(c);
        c = "";
      } else c += ch;
    }
    o.push(c);
    return o.map((x) => x.trim());
  };
  const h = sp(L[0] || "").map((x) => x.toLowerCase());
  return L.slice(1).map((l) => {
    const v = sp(l);
    const o = {};
    h.forEach((k, i) => (o[k] = v[i]));
    return {
      name: o.name,
      phone: o.phone,
      amountDue: o.amountdue,
      dueDate: o.duedate,
      consent: o.consent,
      loan: o.loan,
      original: o.original || o.originalamount,
      remaining: o.remaining || o.remainingbalance,
      product: o.product,
    };
  });
}

export const sampleCsvData = () => ({
  name: "sample-overdue-list.csv",
  rows: [
    "Anwar Hossain",
    "Farida Begum",
    "Mizanur Rahman",
    "Salma Khatun",
    "Tanvir Ahmed",
    "Rokeya Sultana",
    "Jashim Uddin",
    "Lipi Akter",
  ]
    .map((n, i) => ({
      name: n,
      phone: "+88017" + (1000000 + i * 1111111),
      amountDue: 3000 + i * 900,
      dueDate: addDays(-(10 + i * 6)),
      consent: "yes",
      loan: "LN-9" + (100 + i),
    }))
    .concat([
      {
        name: "No Consent",
        phone: "+8801700000001",
        amountDue: 2000,
        dueDate: addDays(-9),
        consent: "no",
      },
      {
        name: "Bad Phone",
        phone: "01700",
        amountDue: 2000,
        dueDate: addDays(-9),
        consent: "yes",
      },
    ]),
});
