import { useEffect, useState } from "react";
import { getPortfolio } from "../api/client";

const GROUP_META = {
  critical: { title: "Critical Tests", color: "#991b1b", bg: "#fee2e2" },
  redundant: { title: "Redundant Tests", color: "#854d0e", bg: "#fef9c3" },
  weak: { title: "Weak Tests", color: "#3730a3", bg: "#e0e7ff" },
};

function Group({ groupKey, items }) {
  const meta = GROUP_META[groupKey];
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: "1.05rem", marginBottom: 10, color: meta.color }}>
        {meta.title} ({items.length})
      </h2>
      {items.length === 0 ? (
        <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>None detected.</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {items.map((a, i) => (
            <div
              key={`${a.test_case_id}-${i}`}
              style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, background: "#fff" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700 }}>{a.test_title}</span>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: meta.bg,
                    color: meta.color,
                  }}
                >
                  {a.action_type.toUpperCase()}
                </span>
              </div>
              <p style={{ color: "#334155", fontSize: "0.85rem", margin: "6px 0 0" }}>{a.reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PortfolioPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPortfolio()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p style={{ padding: 24, color: "#991b1b" }}>Failed to load portfolio: {error}</p>;
  if (!data) return <p style={{ padding: 24 }}>Loading…</p>;

  return (
    <div>
      <h1 style={{ fontSize: "1.4rem", marginBottom: 4 }}>Test Portfolio Management</h1>
      <p style={{ color: "#64748b", marginBottom: 24 }}>
        Redundancy, criticality, and weakness analysis across all test cases
      </p>
      <Group groupKey="critical" items={data.critical} />
      <Group groupKey="redundant" items={data.redundant} />
      <Group groupKey="weak" items={data.weak} />
    </div>
  );
}
