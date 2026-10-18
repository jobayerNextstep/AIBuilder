// src/views/FollowupsView.jsx
import React, { useEffect } from "react";
import { useAppState } from "../models/StateContext";
import { addDays } from "../models/domainRules";
import { FollowupRow } from "./components/Rows";

export const FollowupsView = ({ onKept, onUndo, onCallAgain }) => {
  const { calls, mkt, kept, syncWithBackend } = useAppState();
  const today = addDays(0);

  // পেজ ওপেন হওয়া মাত্রই ডাটাবেজ থেকে লেটেস্ট পেমেন্ট স্ট্যাটাস আনবে
  useEffect(() => {
    syncWithBackend();
  }, []);

  const groups = { due: [], up: [], done: [] };

  calls
    .filter((c) => (c.b?.pack || "bd") === mkt && c.outcome?.type === "promise")
    .forEach((c) => {
      const callKey = c.callId || c.id;

      // ✅ MongoDB-তে যদি paidStatus 'kept' বা 'missed' থাকে, সে সরাসরি Done-এ থাকবে
      const isFinished =
        c.paidStatus === "kept" ||
        c.paidStatus === "missed" ||
        kept[callKey] === "kept" ||
        kept[callKey] === "missed";

      if (isFinished) {
        groups.done.push(c);
      } else if (c.outcome?.date && c.outcome.date <= today) {
        groups.due.push(c);
      } else {
        groups.up.push(c);
      }
    });

  const renderSection = (title, key, emptyHint) => (
    <React.Fragment key={key}>
      <h2 className="gh">
        {title} <span className="mu">{groups[key].length}</span>
      </h2>
      {groups[key].length > 0 ? (
        <section className="card">
          {groups[key].map((c) => {
            const callKey = c.callId || c.id;
            // ডাটাবেজের স্ট্যাটাসকে প্রাধান্য দেওয়া
            const currentStatus =
              c.paidStatus === "kept" || kept[callKey] === "kept"
                ? "kept"
                : "missed";

            return (
              <FollowupRow
                key={callKey}
                call={c}
                category={key}
                keptStatus={currentStatus}
                onKept={onKept}
                onUndo={onUndo}
                onCallAgain={onCallAgain}
              />
            );
          })}
        </section>
      ) : (
        <p className="sub">{emptyHint}</p>
      )}
    </React.Fragment>
  );

  return (
    <div>
      <div className="chead">
        <h1 className="grow">Follow-ups</h1>
      </div>
      <p className="sub" style={{ marginTop: 0 }}>
        Check whether borrowers kept their promises.
      </p>

      {renderSection("Due or overdue", "due", "Nothing is due right now.")}
      {renderSection("Coming up", "up", "No upcoming promises.")}
      {renderSection("Done", "done", "Nothing marked yet.")}
    </div>
  );
};