// src/views/SettingsView.jsx
import { useState } from "react";
import { useAppState } from "../models/StateContext";
import { assignSipVoiceAi, DID_NUMBER } from "../models/apiService";
import {
  GEMINI_LANGUAGE_CODES,
  GEMINI_MODELS,
  GEMINI_VOICES,
} from "../models/constants";

export const SettingsView = () => {
  const {
    name,
    setName,
    packs,
    mkt,
    setMkt,
    toast,
    isConnected,
    aiConfig,
    updateAiConfig,
  } = useAppState();

  const [localName, setLocalName] = useState(name);
  const [localAi, setLocalAi] = useState(aiConfig);
  const [assigning, setAssigning] = useState(false);
  const handleSaveProfile = () => {
    setName(localName.trim() || name);
    toast("Profile name saved");
  };

  const handleAssignVoiceAi = async () => {
    if (!localAi.callerNumber) {
      return toast("Please enter a valid SIP / DID number!");
    }

    setAssigning(true);
    try {
      await assignSipVoiceAi({
        callerNumber: localAi.callerNumber,
        model: localAi.model,
        voiceName: localAi.voiceName,
        languageCode: localAi.languageCode,
        pipelineType: "multimodal_live",
      });

      updateAiConfig(localAi);
      toast(
        `SIP ${localAi.callerNumber} assigned to ${localAi.voiceName} successfully!`,
      );
    } catch (err) {
      console.error("Assign error:", err);
      toast("Failed to assign SIP Voice AI: " + err.message);
    } finally {
      setAssigning(false);
    }
  };

  const selectedVoiceObj = GEMINI_VOICES.find(
    (v) => v.value === localAi.voiceName,
  );

  return (
    <div>
      <div className="chead">
        <h1 className="grow">Settings</h1>
      </div>
      <p className="sub" style={{ marginTop: 0 }}>
        Manage your profile, Gemini Multimodal Live voice engine, and market
        compliance rules.
      </p>

      <section className="card pad" style={{ marginTop: "16px" }}>
        <h2>Your Profile</h2>
        <label className="mu">
          Display Name
          <input
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            style={{ marginTop: "6px" }}
          />
        </label>
        <div
          className="mb"
          style={{ justifyContent: "flex-start", marginTop: "14px" }}
        >
          <button className="btn sm" onClick={handleSaveProfile}>
            Save Profile
          </button>
        </div>
      </section>

      {/* ২. ✅ Voice AI Configuration & Assignment Card */}
      <section className="card pad" style={{ marginTop: "16px" }}>
        <div className="lh" style={{ padding: "0 0 10px" }}>
          <h2>Voice AI Configuration (Google Gemini Live)</h2>
          <span className="pl b" style={{ fontSize: "11px" }}>
            Native Multimodal Live v2
          </span>
          <span className="grow" />
          <span className="pl g">Gemini Ready</span>
        </div>

        <p className="sub" style={{ margin: "2px 0 16px" }}>
          Assign the Google Gemini Voice model, speaker tone, language, and SIP
          DID line to this application.
        </p>

        {/* Inputs Grid */}
        <div className="two">
          <label className="mu">
            Voice Model
            <select
              value={localAi.model}
              onChange={(e) =>
                setLocalAi({ ...localAi, model: e.target.value })
              }
              style={{ marginTop: "6px" }}
            >
              {GEMINI_MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>

          <label className="mu">
            Speech Language
            <select
              value={localAi.languageCode}
              onChange={(e) =>
                setLocalAi({ ...localAi, languageCode: e.target.value })
              }
              style={{ marginTop: "6px" }}
            >
              {GEMINI_LANGUAGE_CODES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="two" style={{ marginTop: "12px" }}>
          <label className="mu">
            Voice Name (Speaker)
            <select
              value={localAi.voiceName}
              onChange={(e) =>
                setLocalAi({ ...localAi, voiceName: e.target.value })
              }
              style={{ marginTop: "6px" }}
            >
              <optgroup label="Male Voices">
                {GEMINI_VOICES.filter((v) => v.gender === "male").map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Female Voices">
                {GEMINI_VOICES.filter((v) => v.gender === "female").map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>

          <label className="mu">
            Target SIP DID / Caller Number
            <input
              value={localAi.callerNumber}
              onChange={(e) =>
                setLocalAi({ ...localAi, callerNumber: e.target.value })
              }
              placeholder={`e.g. ${DID_NUMBER}`}
              style={{ marginTop: "6px" }}
            />
          </label>
        </div>

        {/* Live Info Banner */}
        <div
          style={{
            background: "var(--prs)",
            border: "1px solid var(--bd)",
            borderRadius: "10px",
            padding: "10px 14px",
            marginTop: "16px",
            fontSize: "12.5px",
          }}
        >
          <span style={{ color: "var(--pr)", fontWeight: 600 }}>
            Active Voice Tone:{" "}
          </span>
          <b>{selectedVoiceObj?.label || localAi.voiceName}</b> · Direct WebRTC
          Full Duplex Audio Loop
        </div>

        {/* Assign Button */}
        <div
          className="mb"
          style={{ justifyContent: "flex-start", marginTop: "16px" }}
        >
          <button
            className="btn sm"
            onClick={handleAssignVoiceAi}
            disabled={assigning}
          >
            {assigning ? "Assigning to Server..." : "Assign AI & Save"}
          </button>
        </div>
      </section>

      {/* ৩. মার্কেট পলিসি কার্ড */}
      <section className="card pad" style={{ marginTop: "16px" }}>
        <h2>Markets</h2>
        <p className="sub" style={{ marginTop: 0 }}>
          A market holds the language, calling hours, and debt collection limits
          the AI must obey.
        </p>

        {packs.map((p) => (
          <div
            className="row"
            key={p.id}
            style={{ padding: "10px 0", flexWrap: "wrap" }}
          >
            <div className="grow">
              <b>{p.name}</b>
              <small>
                {p.language || p.lang || ""}
                {p.hours
                  ? ` · calls ${p.hours[0]}:00–${p.hours[1]}:00 · up to ${p.limits.maxRescheduleDays} days to pay`
                  : ""}
              </small>
            </div>

            {p.id === mkt ? (
              <span className="pl g">In use</span>
            ) : p.status === "Draft" ? (
              <span className="pl">Draft</span>
            ) : (
              <button
                className="btn o sm"
                onClick={() => {
                  setMkt(p.id);
                  toast("Market changed");
                }}
              >
                Use this market
              </button>
            )}

            {p.hours && (
              <details style={{ width: "100%", marginTop: "8px" }}>
                <summary>See rules</summary>
                <div className="kv">
                  <span>Disclosure</span>
                  <b style={{ fontWeight: 500, textAlign: "right" }}>
                    {p.disclosure}
                  </b>
                </div>
                <div className="kv">
                  <span>Never allowed</span>
                  <b style={{ fontWeight: 500, textAlign: "right" }}>
                    {p.banned.join(", ")}
                  </b>
                </div>
                <div className="kv">
                  <span>Smallest payment</span>
                  <b style={{ fontWeight: 500 }}>
                    {p.limits.minPartialPct}% of an installment
                  </b>
                </div>
              </details>
            )}
          </div>
        ))}
      </section>

      {/* ৪. কানেকশন কার্ড */}
      <section className="card pad" style={{ marginTop: "16px" }}>
        <h2>Connection</h2>
        <div className="kv">
          <span>Backend Server</span>
          <b
            style={{
              fontWeight: 500,
              color: isConnected ? "var(--ok)" : "var(--wn)",
            }}
          >
            {isConnected ? "Connected (Live MongoDB API)" : "Disconnected"}
          </b>
        </div>
      </section>
    </div>
  );
};
