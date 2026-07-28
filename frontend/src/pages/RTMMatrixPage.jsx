import {
  BarChart3,
  Bug,
  CheckCircle2,
  Clock,
  FileText,
  ListChecks,
  Plus,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProjectSettings, getRTM, regenerateRTM, updateProjectSettings } from "../api/client";
import AddMatrixRecordModal from "../components/AddMatrixRecordModal";

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className={`flex items-center gap-4 rounded-2xl border-l-4 bg-white p-5 shadow-sm ${accent.border}`}>
      <span className={`flex h-10 w-10 items-center justify-center rounded-full ${accent.bg}`}>
        <Icon size={18} className={accent.text} />
      </span>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-xl font-bold text-[#1e1b4b]">{value}</p>
      </div>
    </div>
  );
}

function TestStatusBadge({ status }) {
  if (status === "approved")
    return (
      <span className="inline-flex items-center gap-1 text-green-600">
        <CheckCircle2 size={16} /> Pass
      </span>
    );
  if (status === "rejected")
    return (
      <span className="inline-flex items-center gap-1 text-red-600">
        <XCircle size={16} /> Fail
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-slate-400">
      <Clock size={16} /> Pending
    </span>
  );
}

function flattenRows(requirements) {
  const rows = [];
  for (const r of requirements) {
    const tests = r.acceptance_criteria.flatMap((ac) => ac.tests);
    if (tests.length === 0) {
      rows.push({ req: r, test: null });
    } else {
      for (const t of tests) rows.push({ req: r, test: t });
    }
  }
  return rows;
}

export default function RTMMatrixPage() {
  const [requirements, setRequirements] = useState(null);
  const [settings, setSettings] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);

  const load = () => {
    getRTM()
      .then(setRequirements)
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    load();
    getProjectSettings().then(setSettings).catch(() => {});
  }, []);

  const saveSettings = (field) => async (e) => {
    const updated = { ...settings, [field]: e.target.value };
    setSettings(updated);
  };

  const persistSettings = () => {
    if (settings) updateProjectSettings(settings).catch(() => {});
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const data = await regenerateRTM();
      setRequirements(data);
    } finally {
      setRegenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text("Requirements Traceability Matrix", 14, 16);
    doc.setFontSize(10);
    doc.text(settings?.project_name || "", 14, 23);

    const rows = flattenRows(requirements || []);
    autoTable(doc, {
      startY: 28,
      head: [[
        "Req. ID", "Description", "Source", "Type", "WBS Deliverables",
        "Test Case ID", "Test Description", "Result",
      ]],
      body: rows.map(({ req, test }) => [
        `REQ-${req.requirement_id}`,
        req.description,
        req.source,
        req.req_type,
        req.wbs_deliverables,
        test ? `TC-${test.test_case_id}` : "—",
        test ? test.title : "No test linked",
        test ? test.status : "—",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [67, 56, 202] },
    });

    doc.save("RTM_Report.pdf");
  };

  if (error) return <p className="text-red-700">Failed to load RTM: {error}</p>;
  if (!requirements) return <p className="text-slate-500">Loading…</p>;

  const rows = flattenRows(requirements);
  const totalTests = rows.filter((r) => r.test).length;
  const scored = rows.filter((r) => r.test && r.test.quality_score != null);
  const passed = scored.filter((r) => r.test.status === "approved");
  const passRate = scored.length ? (passed.length / scored.length) * 100 : 0;
  const defects = rows.filter((r) => r.test && r.test.status === "rejected").length;

  return (
    <div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="w-full max-w-md rounded-xl border border-indigo-900/70 p-4 lg:w-[380px]">
          {[
            ["project_name", "Project Name:"],
            ["project_manager", "Project Manager:"],
            ["project_description", "Project Desc:"],
          ].map(([field, label]) => (
            <div key={field} className="mb-2 flex items-start gap-2 last:mb-0">
              <span className="w-32 shrink-0 pt-1 text-sm font-bold text-slate-700">{label}</span>
              {field === "project_description" ? (
                <textarea
                  rows={2}
                  className="w-full resize-none border-b border-slate-400 bg-transparent pb-1 text-sm text-indigo-700 focus:border-indigo-600 focus:outline-none"
                  value={settings?.[field] || ""}
                  onChange={saveSettings(field)}
                  onBlur={persistSettings}
                />
              ) : (
                <input
                  className="w-full border-b border-slate-400 bg-transparent pb-1 text-sm text-indigo-700 focus:border-indigo-600 focus:outline-none"
                  value={settings?.[field] || ""}
                  onChange={saveSettings(field)}
                  onBlur={persistSettings}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col items-end gap-3">
          <h1 className="text-right text-3xl font-extrabold leading-tight text-[#1e1b4b]">
            Requirements
            <br />
            Traceability Matrix
          </h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={load}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw size={15} /> REFRESH
            </button>
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={regenerating}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              <Sparkles size={15} /> {regenerating ? "GENERATING…" : "AUTO-GENERATE MATRIX"}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-[#1e1b4b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#151235]"
            >
              <Plus size={15} /> ADD MATRIX RECORD
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              <FileText size={15} /> DOWNLOAD PDF REPORT
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-5">
        <StatCard
          label="Requirements"
          value={requirements.length}
          icon={ListChecks}
          accent={{ border: "border-blue-400", bg: "bg-blue-50", text: "text-blue-500" }}
        />
        <StatCard
          label="Test Cases"
          value={totalTests}
          icon={CheckCircle2}
          accent={{ border: "border-green-400", bg: "bg-green-50", text: "text-green-500" }}
        />
        <StatCard
          label="Total Pass Rate"
          value={`${passRate.toFixed(1)}%`}
          icon={BarChart3}
          accent={{ border: "border-orange-400", bg: "bg-orange-50", text: "text-orange-500" }}
        />
        <StatCard
          label="Defects Found"
          value={defects}
          icon={Bug}
          accent={{ border: "border-red-400", bg: "bg-red-50", text: "text-red-500" }}
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr>
              <th colSpan={5} className="border-b border-blue-100 bg-blue-50 px-4 py-2 text-left font-bold text-blue-800">
                Requirements
              </th>
              <th colSpan={3} className="border-b border-green-100 bg-green-50 px-4 py-2 text-left font-bold text-green-800">
                Testing
              </th>
            </tr>
            <tr className="text-xs uppercase text-slate-500">
              <th className="px-4 py-2 text-left">Req. ID</th>
              <th className="px-4 py-2 text-left">Requirements Description</th>
              <th className="px-4 py-2 text-left">Requirements Source</th>
              <th className="px-4 py-2 text-left">Requirement Type</th>
              <th className="px-4 py-2 text-left">WBS Deliverables</th>
              <th className="px-4 py-2 text-left">Test Case ID</th>
              <th className="px-4 py-2 text-left">Test Description</th>
              <th className="px-4 py-2 text-left">TEST</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ req, test }, i) => (
              <tr key={`${req.requirement_id}-${test?.test_case_id ?? "none"}-${i}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium">
                  <Link to={`/requirements/${req.requirement_id}`} className="text-indigo-600 hover:underline">
                    REQ-{req.requirement_id}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-slate-600">{req.description}</td>
                <td className="px-4 py-2.5 text-slate-600">{req.source || "—"}</td>
                <td className="px-4 py-2.5 text-slate-600">{req.req_type || "—"}</td>
                <td className="px-4 py-2.5 text-slate-600">{req.wbs_deliverables || "—"}</td>
                <td className="px-4 py-2.5 text-slate-600">{test ? `TC-${test.test_case_id}` : "—"}</td>
                <td className="px-4 py-2.5 text-slate-600">{test ? test.title : "No test linked"}</td>
                <td className="px-4 py-2.5">{test ? <TestStatusBadge status={test.status} /> : "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  No requirements yet — click "Add Matrix Record" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <AddMatrixRecordModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}
