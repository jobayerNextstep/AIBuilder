export const RS = {
  income_timing: "Income timing",
  financial_difficulty: "Financial difficulty",
  forgot: "Forgot",
  illness: "Illness or loss",
  dispute: "Dispute",
  other: "Other",
};

export const F0 = {
  out: "promise",
  amount: "",
  date: "",
  reason: "income_timing",
  notes: "",
  name: "",
  cname: "",
  pack: "bd",
  maxAttempts: 3,
  retryHours: 4,
  concurrency: 3,
};

// ==========================================
// ✅ Gemini Voice AI Engine Constants
// ==========================================
export const GEMINI_MODELS = [
  { label: "Gemini 3.8 Live (Recommended)", value: "models/gemini-3.8-live" },
  { label: "Gemini 3.8 Live Extended Thinking", value: "models/gemini-3.8-live-extended-thinking" },
  { label: "Gemini 3.1 Flash Live Preview", value: "models/gemini-3.1-flash-live-preview" },
];

export const GEMINI_LANGUAGE_CODES = [
  { label: "Bengali (Bangladesh) - bn-BD", value: "bn-BD" },
  { label: "Bengali (India) - bn-IN", value: "bn-IN" },
  { label: "English (United States) - en-US", value: "en-US" },
  { label: "English (United Kingdom) - en-GB", value: "en-GB" },
  { label: "English (India) - en-IN", value: "en-IN" },
  { label: "Hindi (India) - hi-IN", value: "hi-IN" },
  { label: "Urdu (Pakistan) - ur-PK", value: "ur-PK" },
  { label: "Arabic (Saudi Arabia) - ar-SA", value: "ar-SA" },
  { label: "Spanish (United States) - es-US", value: "es-US" },
  { label: "French (France) - fr-FR", value: "fr-FR" },
  { label: "German (Germany) - de-DE", value: "de-DE" },
  { label: "Chinese (Simplified) - zh-CN", value: "zh-CN" },
  { label: "Japanese (Japan) - ja-JP", value: "ja-JP" },
];

export const GEMINI_VOICES = [
  { label: "[Male] Zubenelgenubi (Authoritative / Steady / Recommended)", value: "Zubenelgenubi", gender: "male" },
  { label: "[Male] Puck (Playful / Expressive / Upbeat)", value: "Puck", gender: "male" },
  { label: "[Male] Charon (Deep / Confident / Formal)", value: "Charon", gender: "male" },
  { label: "[Male] Fenrir (Energetic / Bold / Fast)", value: "Fenrir", gender: "male" },
  { label: "[Male] Umbriel (Warm / Clear / Conversational)", value: "Umbriel", gender: "male" },
  { label: "[Male] Gacrux (Crisp / Professional)", value: "Gacrux", gender: "male" },
  { label: "[Male] Orus (Rich / Dynamic)", value: "Orus", gender: "male" },

  { label: "[Female] Aoede (Smooth / Natural / Recommended)", value: "Aoede", gender: "female" },
  { label: "[Female] Kore (Calm / Gentle / Polite)", value: "Kore", gender: "female" },
  { label: "[Female] Leda (Youthful / Friendly)", value: "Leda", gender: "female" },
  { label: "[Female] Zephyr (Bright / Clear)", value: "Zephyr", gender: "female" },
  { label: "[Female] Callirrhoe (Soft / Elegant)", value: "Callirrhoe", gender: "female" },
  { label: "[Female] Pulcherrima (Warm / Engaging)", value: "Pulcherrima", gender: "female" },
];