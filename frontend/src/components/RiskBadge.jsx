const STYLES = {
  CRITICAL: { background: "#fee2e2", color: "#991b1b", border: "#fca5a5" },
  HIGH: { background: "#ffedd5", color: "#9a3412", border: "#fdba74" },
  MEDIUM: { background: "#fef9c3", color: "#854d0e", border: "#fde047" },
  LOW: { background: "#e0e7ff", color: "#3730a3", border: "#c7d2fe" },
};

export default function RiskBadge({ level }) {
  const style = STYLES[level] || STYLES.LOW;
  return (
    <span
      style={{
        background: style.background,
        color: style.color,
        border: `1px solid ${style.border}`,
        borderRadius: "6px",
        padding: "2px 10px",
        fontSize: "0.78rem",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {level}
    </span>
  );
}
