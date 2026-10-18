import { useAppState } from "../models/StateContext";
import { AttentionRow } from "./components/Rows";

export const ReviewView = ({ onOpenCall, onDoneItem }) => {
  const { dashboardData, done } = useAppState();

  const attentionList = (dashboardData?.attentionList || []).filter(
    (x) => !done[x.c?.id] && !done[x.c?.callId]
  );

  return (
    <div>
      <div className="chead">
        <h1 className="grow">Needs review</h1>
      </div>
      <p className="sub" style={{ marginTop: 0 }}>
        Calls where a human should take a look.
      </p>

      <section className="card">
        {attentionList.map((x, idx) => (
          <AttentionRow
            key={x.c?.id || x.c?.callId || idx}
            item={x}
            onOpen={onOpenCall}
            onDone={onDoneItem}
          />
        ))}

        {attentionList.length === 0 && (
          <div className="empty">
            Nothing needs your attention. Nice work.
          </div>
        )}
      </section>
    </div>
  );
};