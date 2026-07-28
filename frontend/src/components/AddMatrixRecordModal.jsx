import { useState } from "react";
import { createAcceptanceCriteria, createRequirement, createTestCase, predictQuality } from "../api/client";
import Modal from "./Modal";

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";
const labelCls = "mb-1 block text-xs font-semibold text-slate-600";

export default function AddMatrixRecordModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    source: "",
    req_type: "Functional",
    wbs_deliverables: "",
    acceptance_criteria: "",
    test_title: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const requirement = await createRequirement({
        title: form.title,
        description: form.description,
        source: form.source,
        req_type: form.req_type,
        wbs_deliverables: form.wbs_deliverables,
      });

      if (form.acceptance_criteria.trim()) {
        const ac = await createAcceptanceCriteria(requirement.id, {
          description: form.acceptance_criteria,
        });

        if (form.test_title.trim()) {
          const test = await createTestCase({
            title: form.test_title,
            steps: "",
            acceptance_criteria_id: ac.id,
            assertion_strength: 70,
            coverage_percent: 70,
            boundary_coverage: 70,
            error_handling: 70,
            mutation_resistance: 70,
          });
          await predictQuality(test.id);
        }
      }

      onCreated();
    } catch (e) {
      setErr(e.response?.data?.detail ? JSON.stringify(e.response.data.detail) : e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add Matrix Record" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {err && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}

        <div>
          <label className={labelCls}>Requirement Title</label>
          <input className={inputCls} value={form.title} onChange={set("title")} required />
        </div>
        <div>
          <label className={labelCls}>Requirements Description</label>
          <textarea className={inputCls} value={form.description} onChange={set("description")} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Requirements Source</label>
            <input className={inputCls} value={form.source} onChange={set("source")} placeholder="e.g. Product Spec" />
          </div>
          <div>
            <label className={labelCls}>Requirement Type</label>
            <select className={inputCls} value={form.req_type} onChange={set("req_type")}>
              <option>Functional</option>
              <option>Non-Functional</option>
              <option>Business</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>WBS Deliverables</label>
            <input className={inputCls} value={form.wbs_deliverables} onChange={set("wbs_deliverables")} />
          </div>
        </div>

        <hr className="border-slate-200" />

        <div>
          <label className={labelCls}>Acceptance Criteria (optional)</label>
          <textarea
            className={inputCls}
            value={form.acceptance_criteria}
            onChange={set("acceptance_criteria")}
            placeholder="Describe the acceptance criteria for this requirement"
          />
        </div>
        <div>
          <label className={labelCls}>Test Case Title (optional, requires acceptance criteria above)</label>
          <input
            className={inputCls}
            value={form.test_title}
            onChange={set("test_title")}
            placeholder="e.g. test_should_do_x"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Create Record"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

