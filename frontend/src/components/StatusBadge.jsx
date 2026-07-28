const STYLES = {
  "FULLY COVERED": { background: "#dcfce7", color: "#166534", border: "#86efac" },
  PARTIAL: { background: "#fef9c3", color: "#854d0e", border: "#fde047" },
  "NOT COVERED": { background: "#fee2e2", color: "#991b1b", border: "#fca5a5" },
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || STYLES["NOT COVERED"];
  return (
    <span
      style={{
        background: style.background,
        color: style.color,
        border: `1px solid ${style.border}`,
        borderRadius: "999px",
        padding: "2px 10px",
        fontSize: "0.78rem",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}
