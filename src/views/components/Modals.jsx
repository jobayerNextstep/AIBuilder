// src/views/components/Modals.jsx
import React from "react";
import { useAppState } from "../../models/StateContext";
import { RS } from "../../models/constants";
import { chk, offers, parseCsvText, sampleCsvData } from "../../models/domainRules";

export const Modals = ({
  onStartCall,
  onEndCall,
  onHandoffCall,
  onSaveResult,
  onLaunchCampaign,
}) => {
  const { modal, setModal, bs, calls, sel, packs, form, setForm, cd, setCd } = useAppState();

  if (!modal) return null;

  const currentCall = calls.find((c) => c.id === sel || c.callId === sel);
  const pack = packs.find((p) => p.id === (currentCall?.b?.pack || form.pack || "bd"));

  return (
    <>
      <div className="ov" onClick={() => setModal(null)} />
      <div className="md" role="dialog" aria-modal="true">
        {/* ১. START CALL MODAL */}
        {modal.t === "start" && (() => {
          const x = bs.find((y) => y.id === modal.id);
          const p = packs.find((pk) => pk.id === x?.pack);
          return (
            <div>
              <h2>Call {x?.name}?</h2>
              <p>
                The AI will call {x?.phone} in {p?.language || p?.lang || "the local language"}. The call is recorded, and the AI can only offer what your policy allows.
              </p>
              <div className="mb">
                <button className="btn o" onClick={() => setModal(null)}>Cancel</button>
                <button className="btn" onClick={() => onStartCall(x?.id)}>Start call</button>
              </div>
            </div>
          );
        })()}

        {/* ২. END CALL MODAL */}
        {modal.t === "end" && (
          <div>
            <h2>End this call?</h2>
            <p>The borrower will be disconnected now.</p>
            <div className="mb">
              <button className="btn o" onClick={() => setModal(null)}>Keep talking</button>
              <button className="btn red" onClick={onEndCall}>End call</button>
            </div>
          </div>
        )}

        {/* ৩. HANDOFF MODAL */}
        {modal.t === "hand" && (
          <div>
            <h2>Hand to a human?</h2>
            <p>The AI will end the call and this borrower will appear under <b>Needs review</b> for a human callback.</p>
            <div className="mb">
              <button className="btn o" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn" onClick={onHandoffCall}>Hand over</button>
            </div>
          </div>
        )}

        {/* ৪. EDIT RESULT MODAL */}
        {modal.t === "edit" && currentCall && (() => {
          const off = offers(currentCall, pack);
          return (
            <div>
              <h2>Edit result</h2>
              <div className="seg" role="group" aria-label="Result">
                {[
                  ["promise", "Promise to pay"],
                  ["handoff", "Needs human"],
                  ["no_promise", "No promise"],
                ].map(([val, label]) => (
                  <button
                    key={val}
                    className={form.out === val ? "on" : ""}
                    onClick={() => setForm({ ...form, out: val })}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {form.out === "promise" && (
                <>
                  <div className="two">
                    <label>
                      Amount (৳)
                      <input
                        type="number"
                        min="0"
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      />
                    </label>
                    <label>
                      Date
                      <input
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                      />
                    </label>
                  </div>
                  <div className="chips">
                    <button
                      className="chip"
                      onClick={() => setForm({ ...form, out: "promise", amount: off[0].amt, date: off[0].date })}
                    >
                      Full offer
                    </button>
                    <button
                      className="chip"
                      onClick={() => setForm({ ...form, out: "promise", amount: off[1].amt, date: off[1].date })}
                    >
                      Partial offer
                    </button>
                  </div>
                </>
              )}

              <label>
                Reason
                <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
                  {Object.entries(RS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </label>

              <label>
                Notes
                <textarea
                  rows="2"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </label>

              <div className="mb">
                <button className="btn o" onClick={() => setModal(null)}>Cancel</button>
                <button className="btn" onClick={() => onSaveResult(pack)}>Save</button>
              </div>
            </div>
          );
        })()}

        {/* ৫. NEW CAMPAIGN MODAL (সম্পূর্ণ কার্যকরী) */}
       {modal.t === "camp" && (() => {
          const okRows = cd ? cd.rows.filter((r) => !chk(r)) : [];
          const badRows = cd ? cd.rows.map((r, i) => [i + 2, chk(r)]).filter((x) => x[1]) : [];
          
          const defaultInstruction = `You are 'NRB Bank'—a polite, professional, and compliant loan recovery officer calling on behalf of the lender regarding an overdue loan installment.

### OBJECTIVE:
Contact the borrower, verify their identity, explain their overdue installment, negotiate a repayment commitment within approved policy limits, and confirm their promise to pay (teach-back).

### REGULATORY COMPLIANCE RULES (STRICT):
1. NEVER threaten, shout, shame, or use abusive or pressurized language. Maintain a calm, respectful, and empathetic tone at all times.
2. MANDATORY DISCLOSURE: Start the call stating clearly: 'আসসালামু আলাইকুম, আমি লেন্ডলাইন থেকে বলছি। এই কলটি সেবার মান ও নিরাপত্তার স্বার্থে রেকর্ড করা হচ্ছে।'
3. POLICY LIMITS (CANNOT BE EXCEEDED):
   - Maximum reschedule time: 30 days from today.
   - Minimum partial payment: At least 50% of the installment amount.
   - Principal waiver or unauthorized fee discounts are STRICTLY PROHIBITED.
4. HUMAN ESCALATION: If the customer mentions severe illness/hospitalization, bereavement, aggressive dispute, or asks for a human officer, apologize empathetically and state: 'আমি দুঃখিত। আমি আমাদের একজন প্রতিনিধিকে আপনার সাথে দ্রুত যোগাযোগের জন্য অনুরোধ করছি।' and close the call.

### STEP-BY-STEP CONVERSATION FLOW:
1. GREETING & IDENTITY: Greet the customer, state call recording disclosure, and verify if speaking to the recipient name.
2. OVERDUE NOTIFICATION: State the exact overdue amount due (amountDue), loan ID (loanId), and due date (dueDate). Inquire politely about the reason for delay: 'আপনার কিস্তির সময়সীমা পার হয়ে গেছে। কোনো সমস্যা হচ্ছে কি?'
3. NEGOTIATION (OFFERS):
   - Offer Option A: Pay the full installment amount within up to 30 days.
   - Offer Option B: Pay 50% immediately and the remaining within 15 days.
4. TEACH-BACK & CONFIRMATION: Once the customer agrees to an offer, ask them to confirm in their own words: 'আপনি নিজের কথায় বলবেন কি, কত টাকা কবে দেবেন?'
5. CONCLUSION: Acknowledge the promise: 'ধন্যবাদ। আপনার প্রতিশ্রুতি নথিভুক্ত হয়েছে। ভালো থাকবেন।' and end the call gracefully.`;

          return (
            <div style={{ maxHeight: "82vh", overflowY: "auto", paddingRight: "4px" }}>
              <h2>New campaign</h2>

              <label>
                Name
                <input
                  value={form.cname || ""}
                  onChange={(e) => setForm({ ...form, cname: e.target.value })}
                  placeholder="e.g. Lendline Loan Overdue Recovery Campaign"
                />
              </label>

              <label>
                Market
                <select value={form.pack || "bd"} onChange={(e) => setForm({ ...form, pack: e.target.value })}>
                  {packs.filter((p) => p.status !== "Draft").map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>

              {/* ✅ নতুন Textarea: instructionDetails (AI Prompt) */}
              <label>
                Instruction Details (AI Calling Prompt)
                <textarea
                  rows="6"
                  style={{
                    width: "100%",
                    fontSize: "12.5px",
                    lineHeight: "1.45",
                    fontFamily: "monospace",
                    background: "var(--bg)",
                    border: "1px solid var(--bd)",
                    borderRadius: "8px",
                    padding: "8px",
                    marginTop: "4px",
                  }}
                  value={form.instructionDetails !== undefined ? form.instructionDetails : defaultInstruction}
                  onChange={(e) => setForm({ ...form, instructionDetails: e.target.value })}
                  placeholder="Prompt for the AI agent..."
                />
              </label>

              <label>
                Borrower list (CSV file)
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => {
                    const fl = e.target.files[0];
                    if (fl) {
                      fl.text().then((text) => setCd({ name: fl.name, rows: parseCsvText(text) }));
                    }
                  }}
                />
              </label>

              <p className="sub" style={{ margin: "4px 0", fontSize: "12px" }}>
                Columns: name, phone (with +country code), amountDue, dueDate (YYYY-MM-DD), consent (yes/no), loan, original, remaining, product.{" "}
                <button
                  className="lk"
                  type="button"
                  onClick={() => setCd(sampleCsvData())}
                >
                  Use a sample file
                </button>
              </p>

              {/* Uploaded File Summary */}
              {cd && (
                <div className="of" style={{ margin: "8px 0" }}>
                  <b>{cd.name}</b>: {okRows.length} ready, {badRows.length} skipped
                  {badRows.slice(0, 3).map((x, idx) => (
                    <React.Fragment key={idx}>
                      <br /><small style={{ color: "var(--er)" }}>Row {x[0]}: {x[1]}</small>
                    </React.Fragment>
                  ))}
                </div>
              )}

              <div className="two">
                <label>
                  Attempts per borrower
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={form.maxAttempts || 3}
                    onChange={(e) => setForm({ ...form, maxAttempts: e.target.value })}
                  />
                </label>
                <label>
                  Retry after (hours)
                  <input
                    type="number"
                    min="1"
                    max="48"
                    value={form.retryHours || 4}
                    onChange={(e) => setForm({ ...form, retryHours: e.target.value })}
                  />
                </label>
              </div>

              <label>
                Calls at once
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={form.concurrency || 3}
                  onChange={(e) => setForm({ ...form, concurrency: e.target.value })}
                />
              </label>

              <p className="sub" style={{ margin: "8px 0 0", fontSize: "12px" }}>
                Calls only happen inside the market's calling hours. A borrower is not called again after promising to pay or asking for a human.
              </p>

              <div className="mb" style={{ marginTop: "14px" }}>
                <button className="btn o" type="button" onClick={() => setModal(null)}>Cancel</button>
                <button
                  className="btn"
                  type="button"
                  disabled={!form.cname || okRows.length === 0}
                  onClick={onLaunchCampaign}
                >
                  Launch campaign
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </>
  );
};