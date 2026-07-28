import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getRTMForRequirement } from "../api/client";
import StatusBadge from "../components/StatusBadge";

export default function RequirementDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getRTMForRequirement(id)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p style={{ padding: 24, color: "#991b1b" }}>Failed to load: {error}</p>;
  if (!data) return <p style={{ padding: 24 }}>Loading…</p>;

  return (
    <div>
      <Link to="/rtm" style={{ color: "#4338ca", fontSize: "0.85rem" }}>
        &larr; Back to RTM Matrix
      </Link>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 10 }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", marginBottom: 4 }}>{data.title}</h1>
          <p style={{ color: "#64748b", maxWidth: 640 }}>{data.description}</p>
        </div>
        <StatusBadge status={data.status} />
      </div>

      <div style={{ display: "flex", gap: 24, margin: "20px 0", color: "#334155", fontSize: "0.9rem" }}>
        <span>
          <b>{data.covered_acceptance_criteria}</b>/{data.total_acceptance_criteria} AC covered
        </span>
        <span>
          <b>{data.total_tests}</b> linked tests
        </span>
        <span>
          Avg coverage <b>{data.avg_coverage_percent.toFixed(0)}%</b>
        </span>
      </div>

      <h2 style={{ fontSize: "1.05rem", marginTop: 24, marginBottom: 10 }}>Acceptance Criteria</h2>
      <div style={{ display: "grid", gap: 14 }}>
        {data.acceptance_criteria.map((ac) => (
          <div key={ac.acceptance_criteria_id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600 }}>{ac.description}</span>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: ac.covered ? "#166534" : "#991b1b",
                }}
              >
                {ac.covered ? "COVERED" : "UNCOVERED"}
              </span>
            </div>
            {ac.tests.length > 0 ? (
              <table style={{ width: "100%", marginTop: 10, borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "#64748b" }}>
                    <th style={{ padding: "4px 0" }}>Test</th>
                    <th>Status</th>
                    <th>Quality</th>
                    <th>Coverage</th>
                  </tr>
                </thead>
                <tbody>
                  {ac.tests.map((t) => (
                    <tr key={t.test_case_id} style={{ borderTop: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "6px 0" }}>{t.title}</td>
                      <td>{t.status}</td>
                      <td>{t.quality_score != null ? t.quality_score.toFixed(0) : "—"}</td>
                      <td>{t.coverage_percent.toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: 8 }}>No tests linked yet.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
