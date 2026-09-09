"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";
import { Button } from "@repo/ui/button";

import { API_BASE } from "../../../lib/config";
import { apiFetch } from "../../../lib/api";

type MedicalRecord = {
  id: string;
  userId: string;
  bloodType?: string;
  allergies?: string;
  conditions?: string;
  medications?: string;
  notes?: string;
  createdAt: string;
};

type FormState = {
  bloodType: string;
  allergies: string;
  conditions: string;
  medications: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  bloodType: "",
  allergies: "",
  conditions: "",
  medications: "",
  notes: "",
};

/**
 * Performs  medical records page operation.
 * @returns {any} Description of return value
 */
export default function MedicalRecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const hasAnyFormValue = useMemo(() => {
    return Object.values(form).some((v) => v.trim().length > 0);
  }, [form]);

  const loadRecords = useCallback(async (signal?: AbortSignal) => {
    setError(null);
    setLoading(true);

    try {
      const res = await apiFetch(`${API_BASE}/medical-records`, {
        signal,
      });
      if (!res.ok) throw new Error("Failed to load records");

      const json = await res.json();
      setRecords(json.data?.items ?? []);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      console.error(e);
      setError("Could not load medical records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadRecords(controller.signal);
    return () => controller.abort();
  }, [loadRecords]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch(`${API_BASE}/medical-records`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        throw new Error("Failed to create record");
      }

      setForm(EMPTY_FORM);
      await loadRecords();
    } catch (e) {
      console.error(e);
      setError("Could not create record.");
    } finally {
      setSubmitting(false);
    }
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <DreamySunsetBackground className="px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-display font-bold text-jewel-900 mb-4">Medical Records</h1>

        {error && (
          <div className="mb-4 rounded-xl border border-jewel-ruby/30 bg-jewel-ruby/10 px-4 py-3 text-sm text-jewel-ruby">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="mb-8 space-y-4">
          <Field label="Blood Type">
            <input
              value={form.bloodType}
              onChange={(e) => updateField("bloodType", e.target.value)}
              className="w-full rounded-xl border border-jewel-400/30 bg-jewel-50/50 px-3 py-2 text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50"
              placeholder="e.g. O+"
            />
          </Field>

          <Field label="Allergies">
            <input
              value={form.allergies}
              onChange={(e) => updateField("allergies", e.target.value)}
              className="w-full rounded-xl border border-jewel-400/30 bg-jewel-50/50 px-3 py-2 text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50"
              placeholder="e.g. peanuts, dust"
            />
          </Field>

          <Field label="Conditions">
            <input
              value={form.conditions}
              onChange={(e) => updateField("conditions", e.target.value)}
              className="w-full rounded-xl border border-jewel-400/30 bg-jewel-50/50 px-3 py-2 text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50"
              placeholder="e.g. asthma"
            />
          </Field>

          <Field label="Medications">
            <input
              value={form.medications}
              onChange={(e) => updateField("medications", e.target.value)}
              className="w-full rounded-xl border border-jewel-400/30 bg-jewel-50/50 px-3 py-2 text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50"
              placeholder="e.g. cetirizine"
            />
          </Field>

          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              className="w-full rounded-xl border border-jewel-400/30 bg-jewel-50/50 px-3 py-2 text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50 min-h-[100px] resize-none"
              placeholder="Anything important..."
            />
          </Field>

          <Button
            type="submit"
            disabled={submitting || !hasAnyFormValue}
          >
            {submitting ? "Creating..." : "Create"}
          </Button>
        </form>

        <h2 className="text-lg font-display font-bold text-jewel-900 mb-3">Your Records</h2>

        {loading ? (
          <p className="text-sm text-jewel-400">Loading...</p>
        ) : records.length === 0 ? (
          <p className="text-sm text-jewel-400">No records yet.</p>
        ) : (
          <ul className="space-y-4">
            {records.map((r) => (
              <li key={r.id} className="rounded-xl border border-jewel-400/20 bg-jewel-50/60 p-4">
                <Row label="Blood" value={r.bloodType} />
                <Row label="Allergies" value={r.allergies} />
                <Row label="Conditions" value={r.conditions} />
                <Row label="Medications" value={r.medications} />
                {r.notes && <Row label="Notes" value={r.notes} />}

                <div className="mt-3 text-xs text-jewel-400">
                  {new Date(r.createdAt).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DreamySunsetBackground>
  );
}

/**
 * Performs  field operation.
 * @param {{ label: string; children: React.ReactNode; }} {
 *   label,
 *   children,
 * } - Description of {
 *   label,
 *   children,
 * }
 * @returns {any} Description of return value
 */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-jewel-700">{label}</label>
      {children}
    </div>
  );
}

/**
 * Performs  row operation.
 * @param {{ label: string; value?: string; }} { label, value } - Description of { label, value }
 * @returns {any} Description of return value
 */
function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="text-sm">
      <span className="font-semibold text-jewel-800">{label}:</span>{" "}
      <span className="text-jewel-600">{value?.trim() || "\u2014"}</span>
    </div>
  );
}
