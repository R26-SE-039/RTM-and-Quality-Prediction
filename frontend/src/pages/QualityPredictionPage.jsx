import { FlaskConical } from "lucide-react";
import { useEffect, useState } from "react";
import { createTestCase, getRTM, predictQuality } from "../api/client";

const FEATURES = [
  ["assertion_strength", "Assertion Strength"],
  ["coverage_percent", "Code Coverage"],
  ["boundary_coverage", "Boundary Coverage"],
  ["error_handling", "Error Handling"],
  ["mutation_resistance", "Mutation Resistance"],
];

export default function QualityPredictionPage() {
  const [acOptions, setAcOptions] = useState([]);
  const [acId, setAcId] = useState("");
  const [title, setTitle] = useState("");
  const [features, setFeatures] = useState({
    assertion_strength: 70,
    coverage_percent: 70,
    boundary_coverage: 70,
    error_handling: 70,
    mutation_resistance: 70,
  });
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getRTM().then((rtm) =>
      setAcOptions(
        rtm.flatMap((r) =>
          r.acceptance_criteria.map((ac) => ({
            id: ac.acceptance_criteria_id,
            label: `[${r.title}] ${ac.description.slice(0, 60)}`,
          }))
        )
      )
    );
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!acId || !title.trim()) return;
    setSaving(true);
    try {
      const test = await createTestCase({
        title,
        steps: "",
        acceptance_criteria_id: Number(acId),
        ...features,
      });
      const prediction = await predictQuality(test.id);
      setResult(prediction);
      setTitle("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
          <FlaskConical size={20} />
        </span>
        <div>
          <h1 className="text-3xl font-extrabold text-[#1e1b4b]">Quality Prediction</h1>
          <p className="text-slate-500">Score a new test case with the ML quality model</p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 max-w-xl rounded-2xl bg-white p-6 shadow-sm">
        <label className="mb-1 block text-sm font-semibold text-slate-600">Acceptance Criteria</label>
        <select
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          value={acId}
          onChange={(e) => setAcId(e.target.value)}
          required
        >
          <option value="">Select acceptance criteria…</option>
          {acOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>

        <label className="mb-1 block text-sm font-semibold text-slate-600">Test Title</label>
        <input
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. test_checkout_declined_card_shows_error"
          required
        />

        {FEATURES.map(([key, label]) => (
          <div key={key} className="mb-3">
            <div className="mb-1 flex justify-between text-sm text-slate-600">
              <span>{label}</span>
              <span className="font-semibold">{features[key]}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={features[key]}
              onChange={(e) => setFeatures({ ...features, [key]: Number(e.target.value) })}
              className="w-full accent-indigo-600"
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={saving}
          className="mt-2 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? "Scoring…" : "Create & Score Test"}
        </button>

        {result && (
          <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm">
            <p>
              Quality Score: <span className="font-bold">{result.quality_score.toFixed(1)}/100</span>
            </p>
            <p>
              Status:{" "}
              <span className={result.status === "approved" ? "text-green-600" : "text-red-600"}>
                {result.status}
              </span>
            </p>
            <p className="text-slate-400">via {result.method}</p>
          </div>
        )}
      </form>
    </div>
  );
}
