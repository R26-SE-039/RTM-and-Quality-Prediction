import { Bug, CheckCircle2, RadioTower, Shield, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getDashboardSummary } from "../api/client";

function StatCard({ label, value, icon: Icon, gradient, progress, footer }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-sm ${gradient}`}>
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-white/85">{label}</span>
        <Icon size={20} className="text-white/90" />
      </div>
      <div className="mt-3 text-3xl font-bold">{value}</div>
      {footer ? (
        <div className="mt-1.5 flex items-center gap-1 text-xs text-white/90">
          <TrendingUp size={13} />
          {footer}
        </div>
      ) : null}
      <div className="mt-4 h-1.5 rounded-full bg-white/25">
        <div
          className="h-1.5 rounded-full bg-white/85"
          style={{ width: `${Math.max(4, Math.min(100, progress))}%` }}
        />
      </div>
    </div>
  );
}

const TOGGLE_OPTIONS = ["Both", "Quality", "Coverage"];
const DONUT_COLORS = ["#6366f1", "#e2e8f0"];

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(new Date());
  const [trendMode, setTrendMode] = useState("Both");

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (error) return <p className="text-red-700">Failed to load dashboard: {error}</p>;
  if (!summary) return <p className="text-slate-500">Loading…</p>;

  const trendPctLabel =
    summary.quality_trend_pct >= 0
      ? `+${summary.quality_trend_pct.toFixed(1)}%`
      : `${summary.quality_trend_pct.toFixed(1)}%`;

  const notCovered = Math.max(0, summary.requirements_total - summary.requirements_covered);
  const coveredPct = summary.requirements_total
    ? Math.round((summary.requirements_covered / summary.requirements_total) * 100)
    : 0;
  const donutData = [
    { name: "Covered", value: summary.requirements_covered || 0.0001 },
    { name: "Not Covered", value: notCovered || (summary.requirements_total ? 0 : 1) },
  ];

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-indigo-600">ML Test Quality Dashboard</h1>
          <p className="mt-1 text-slate-500">
            Real-time insights &bull; AI-Powered Analysis &bull; Quality Assurance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-sm font-medium text-indigo-600">
            <RadioTower size={15} />
            Live Updates
          </span>
          <span className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-500">
            Last updated: {now.toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-2xl bg-white px-6 py-4 shadow-sm">
        <h2 className="text-lg font-bold text-[#1e1b4b]">System Health Status</h2>
        <span className="rounded-full bg-green-100 px-4 py-1.5 text-sm font-semibold text-green-700">
          All Systems Operational
        </span>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-5">
        <StatCard
          label="Tests Analyzed"
          value={summary.tests_analyzed}
          icon={Bug}
          gradient="bg-gradient-to-br from-indigo-500 to-purple-600"
          progress={Math.min(100, (summary.tests_analyzed / 20) * 100)}
        />
        <StatCard
          label="Avg Quality Score"
          value={`${summary.avg_quality_score.toFixed(0)}/100`}
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-emerald-400 to-green-500"
          progress={summary.avg_quality_score}
          footer={`${trendPctLabel} from earliest data`}
        />
        <StatCard
          label="Coverage Rate"
          value={`${summary.coverage_rate.toFixed(0)}%`}
          icon={CheckCircle2}
          gradient="bg-gradient-to-br from-sky-400 to-blue-500"
          progress={summary.coverage_rate}
        />
        <StatCard
          label="Success Rate"
          value={`${summary.success_rate.toFixed(0)}%`}
          icon={Shield}
          gradient="bg-gradient-to-br from-orange-400 to-red-500"
          progress={summary.success_rate}
        />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-5">
        <div className="col-span-2 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1e1b4b]">Quality &amp; Coverage Trends</h2>
            <div className="flex rounded-lg bg-slate-100 p-1 text-sm">
              {TOGGLE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setTrendMode(opt)}
                  className={`rounded-md px-3 py-1 font-medium transition-colors ${
                    trendMode === opt ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary.trend}>
                <defs>
                  <linearGradient id="qualityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="coverageGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <Tooltip />
                {trendMode !== "Coverage" && (
                  <Area
                    type="monotone"
                    dataKey="avg_quality"
                    name="Quality"
                    stroke="#16a34a"
                    fill="url(#qualityGrad)"
                    strokeWidth={2}
                  />
                )}
                {trendMode !== "Quality" && (
                  <Area
                    type="monotone"
                    dataKey="avg_coverage"
                    name="Coverage"
                    stroke="#4ade80"
                    fill="url(#coverageGrad)"
                    strokeWidth={2}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#1e1b4b]">Requirements Coverage</h2>
          <div className="relative mt-2 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={2}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                  isAnimationActive={false}
                >
                  {donutData.map((entry, i) => (
                    <Cell key={entry.name} fill={DONUT_COLORS[i]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-indigo-600">{coveredPct}%</span>
              <span className="text-xs text-slate-400">Covered</span>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-center gap-6 text-sm">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" /> Covered (
              {summary.requirements_covered})
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" /> Not Covered ({notCovered})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
