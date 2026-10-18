
const P = {
  home: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  pulse: "M3 12h4l3-8 4 16 3-8h4",
  send: "M3 11l18-8-8 18-2-8z",
  list: "M4 6h16M4 12h16M4 18h10",
  check: "M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z",
  alert: "M12 3l10 18H2zM12 10v5M12 18v.01",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
};

export const Icon = ({ name }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d={P[name] || P.home} />
  </svg>
);