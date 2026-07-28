import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getGaps } from "../api/client";
import RiskBadge from "../components/RiskBadge";
import StatusBadge from "../components/StatusBadge";

export default function GapsPage() {
  const [gaps, setGaps] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getGaps()
      .then(setGaps)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p style={{ padding: 24, color: "#991b1b" }}>Failed to load gaps: {error}</p>;
  if (!gaps) return <p style={{ padding: 24 }}>Loading…</p>;

  return (
    <div>
      <h1 style={{ fontSize: "1.4rem", marginBottom: 4 }}>Coverage Gaps</h1>
      <p style={{ color: "#64748b", marginBottom: 20 }}>
        {gaps.length} requirement{gaps.length === 1 ? "" : "s"} with incomplete coverage, sorted by risk
      </p>
      <div style={{ display: "grid", gap: 12 }}>
        {gaps.map((g) => (
          <div key={g.requirement_id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, background: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Link to={`/requirements/${g.requirement_id}`} style={{ fontWeight: 700, color: "#1e1b4b", textDecoration: "none" }}>
                {g.requirement_title}
              </Link>
              <div style={{ display: "flex", gap: 8 }}>
                <StatusBadge status={g.status} />
                <RiskBadge level={g.risk_level} />
              </div>
            </div>
            <p style={{ color: "#334155", fontSize: "0.9rem", margin: 0 }}>{g.recommendation}</p>
          </div>
        ))}
        {gaps.length === 0 && (
          <p style={{ color: "#64748b" }}>No coverage gaps — every requirement is fully covered.</p>
        )}
      </div>
    </div>
  );
}
