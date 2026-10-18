import { useAppState } from "../../models/StateContext";

export const Toast = () => {
  const { toastMsg } = useAppState();
  return (
    <div id="toast" className={toastMsg ? "on" : ""} role="status">
      {toastMsg}
    </div>
  );
};