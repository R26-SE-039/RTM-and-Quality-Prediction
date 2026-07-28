import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTests } from "../api/client";

function StatusPill({ status }) {
  const map = {
    approved: { icon: CheckCircle2, cls: "bg-green-100 text-green-700" },
    rejected: { icon: XCircle, cls: "bg-red-100 text-red-700" },
    pending: { icon: Clock, cls: "bg-slate-100 text-slate-500" },
  };
  const { icon: Icon, cls } = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      <Icon size={13} /> {status}
    </span>
  );
}

export default function TestInventoryPage() {
  const [tests, setTests] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getTests()
      .then(setTests)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-red-700">Failed to load tests: {error}</p>;
  if (!tests) return <p className="text-slate-500">Loading…</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1e1b4b]">Test Inventory</h1>
          <p className="mt-1 text-slate-500">All test cases across every requirement</p>
        </div>
        <Link
          to="/portfolio"
          className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-100"
        >
          View Portfolio Analysis →
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Quality Score</th>
              <th className="px-4 py-3 text-left">Coverage %</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {tests.map((t) => (
              <tr key={t.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-slate-700">TC-{t.id}</td>
                <td className="px-4 py-2.5 text-slate-600">{t.title}</td>
                <td className="px-4 py-2.5 text-slate-600">
                  {t.quality_score != null ? t.quality_score.toFixed(0) : "—"}
                </td>
                <td className="px-4 py-2.5 text-slate-600">{t.coverage_percent.toFixed(0)}%</td>
                <td className="px-4 py-2.5">
                  <StatusPill status={t.status} />
                </td>
              </tr>
            ))}
            {tests.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No test cases yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
