import { GitBranch, Play, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  analyzeGithubCoverage,
  getGithubConnectionStatus,
  getGithubCoverageReport,
  getGithubCoverageStatus,
} from "../api/client";
import ConcentricRings from "../components/ConcentricRings";
import LogTerminal from "../components/LogTerminal";

const STATUS_META = {
  IDLE: { label: "IDLE", dot: "bg-red-500", text: "text-slate-700", bg: "bg-slate-100" },
  RUNNING: { label: "RUNNING", dot: "bg-amber-500 animate-pulse", text: "text-amber-700", bg: "bg-amber-50" },
  DONE: { label: "DONE", dot: "bg-green-500", text: "text-green-700", bg: "bg-green-50" },
  ERROR: { label: "FAILED", dot: "bg-red-500", text: "text-red-700", bg: "bg-red-50" },
};

function ProgressRow({ label, value, highlight }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className={`font-bold ${highlight ? "text-green-600" : "text-indigo-600"}`}>
          {value.toFixed(0)}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100">
        <div
          className={`h-2 rounded-full ${highlight ? "bg-green-500" : "bg-indigo-500"}`}
          style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

export default function CodeCoveragePage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [status, setStatus] = useState("IDLE");
  const [logs, setLogs] = useState([]);
  const [githubConnected, setGithubConnected] = useState(false);
  const [connectionReason, setConnectionReason] = useState(null);
  const [report, setReport] = useState(null);
  const pollRef = useRef(null);

  const loadReport = () => {
    getGithubCoverageReport().then(setReport).catch(() => {});
  };

  const loadConnectionStatus = () => {
    getGithubConnectionStatus()
      .then((s) => {
        setGithubConnected(s.connected);
        setConnectionReason(s.reason);
      })
      .catch(() => {});
  };

  const syncStatus = async () => {
    const s = await getGithubCoverageStatus();
    setStatus(s.status);
    setLogs(s.logs || []);
    if (s.repo_url) setRepoUrl(s.repo_url);
    return s;
  };

  useEffect(() => {
    syncStatus();
    loadConnectionStatus();
    loadReport();
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pollStatus = () => {
    pollRef.current = setInterval(async () => {
      const s = await syncStatus();
      if (s.status !== "RUNNING") {
        clearInterval(pollRef.current);
        if (s.status === "DONE") loadReport();
      }
    }, 1000);
  };

  const runCoverage = async () => {
    if (!repoUrl.trim()) return;
    try {
      const s = await analyzeGithubCoverage(repoUrl);
      setStatus(s.status);
      setLogs(s.logs || []);
      pollStatus();
    } catch (e) {
      // The backend persists a log transcript (including the error) even
      // for the synchronous access-denied/config-error path — sync it now.
      await syncStatus();
      if (!e.response) setStatus("ERROR");
    } finally {
      loadConnectionStatus();
    }
  };

  const meta = STATUS_META[status] || STATUS_META.IDLE;
  const files = report?.files || [];

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-indigo-600">GitHub Code &amp; Branch Coverage</h1>
          <p className="mt-1 text-slate-500">
            Agentic MCP Codebase Analysis &bull; Statement &amp; Branch Tracking &bull; Quality Assurance
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            title={!githubConnected ? connectionReason : undefined}
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium ${
              githubConnected
                ? "border-indigo-200 bg-indigo-50 text-indigo-600"
                : "border-slate-200 bg-slate-50 text-slate-400"
            }`}
          >
            <GitBranch size={15} />
            GitHub MCP {githubConnected ? "Connected" : "Disconnected"}
          </span>
          {!githubConnected && connectionReason && (
            <span className="max-w-xs text-right text-xs text-slate-400">{connectionReason}</span>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-5">
        <div className="col-span-2 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#1e1b4b]">GitHub MCP Repository Target</h2>

          <div className="mt-4 flex gap-3">
            <div className="relative flex-1">
              <GitBranch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="Enter any GitHub Repository URL"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={runCoverage}
              disabled={status === "RUNNING"}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              <Play size={15} /> {status === "RUNNING" ? "RUNNING…" : "RUN COVERAGE"}
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">Agent Status:</span>
              <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold ${meta.bg} ${meta.text}`}>
                <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
            </div>
            <button
              type="button"
              onClick={loadReport}
              className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              <RefreshCw size={14} /> RELOAD REPORT
            </button>
          </div>

          <LogTerminal logs={logs} />
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-bold text-[#1e1b4b]">Coverage Totals</h2>
          <div className="flex justify-center">
            <ConcentricRings
              statement={report?.statement_coverage || 0}
              branch={report?.branch_coverage || 0}
              overall={report?.overall_coverage || 0}
            />
          </div>
          <div className="mt-4">
            <ProgressRow label="Statement Coverage" value={report?.statement_coverage || 0} />
            <ProgressRow label="Branch Coverage" value={report?.branch_coverage || 0} />
            <ProgressRow label="Overall Coverage" value={report?.overall_coverage || 0} highlight />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-[#1e1b4b]">File Breakdown Coverage List</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
                <th className="px-4 py-3 text-left">File Name</th>
                <th className="px-4 py-3 text-left">Statements</th>
                <th className="px-4 py-3 text-left">Statement Coverage</th>
                <th className="px-4 py-3 text-left">Branches</th>
                <th className="px-4 py-3 text-left">Branch Coverage</th>
                <th className="px-4 py-3 text-left">Overall Coverage</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.file_name} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-700">{f.file_name}</td>
                  <td className="px-4 py-2.5 text-slate-600">{f.statements}</td>
                  <td className="px-4 py-2.5 text-slate-600">{f.statement_coverage.toFixed(1)}%</td>
                  <td className="px-4 py-2.5 text-slate-600">{f.branches}</td>
                  <td className="px-4 py-2.5 text-slate-600">{f.branch_coverage.toFixed(1)}%</td>
                  <td className="px-4 py-2.5 text-slate-600">{f.overall_coverage.toFixed(1)}%</td>
                </tr>
              ))}
              {files.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No coverage report yet — run an analysis above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
