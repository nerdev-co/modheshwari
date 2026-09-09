"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { Input } from "@repo/ui/input";

import { API_BASE } from "../../../lib/config";
import { apiFetch } from "../../../lib/api";
import { useUser } from "../../../lib/UserContext";

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

export default function MedicalRecordsPage() {
  const { user, loading } = useUser();
  const navigate = useNavigate();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/signin");
  }, [user, loading, navigate]);

  if (loading) return <DreamySunsetBackground className="px-6 py-10 flex items-center justify-center"><p className="text-jewel-500">Loading...</p></DreamySunsetBackground>;
  if (!user) return null;

  const hasAnyFormValue = useMemo(() => {
    return Object.values(form).some((v) => v.trim().length > 0);
  }, [form]);

  const loadRecords = useCallback(async (signal?: AbortSignal) => {
    setError(null);
    setLoadingData(true);

    try {
      const res = await apiFetch(`${API_BASE}/medical-records`, {
        signal,
      });
      if (!res.ok) throw new Error("Failed to load records");

      const json = await res.json();
      setRecords(json.data?.items ?? []);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError("Could not load medical records.");
    } finally {
      setLoadingData(false);
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
    } catch {
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
            <Input
              value={form.bloodType}
              onChange={(e) => updateField("bloodType", e.target.value)}
              placeholder="e.g. O+"
              aria-label="Blood Type"
            />
          </Field>

          <Field label="Allergies">
            <Input
              value={form.allergies}
              onChange={(e) => updateField("allergies", e.target.value)}
              placeholder="e.g. peanuts, dust"
              aria-label="Allergies"
            />
          </Field>

          <Field label="Conditions">
            <Input
              value={form.conditions}
              onChange={(e) => updateField("conditions", e.target.value)}
              placeholder="e.g. asthma"
              aria-label="Conditions"
            />
          </Field>

          <Field label="Medications">
            <Input
              value={form.medications}
              onChange={(e) => updateField("medications", e.target.value)}
              placeholder="e.g. cetirizine"
              aria-label="Medications"
            />
          </Field>

          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              className="w-full rounded-xl border border-jewel-400/30 bg-jewel-50/50 px-3 py-2 text-jewel-900 placeholder-jewel-400 focus:outline-none focus:ring-2 focus:ring-jewel-gold/50 min-h-[100px] resize-none"
              placeholder="Anything important..."
              aria-label="Notes"
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

        {loadingData ? (
          <p className="text-sm text-jewel-500">Loading...</p>
        ) : records.length === 0 ? (
          <p className="text-sm text-jewel-500">No records yet.</p>
        ) : (
          <ul className="space-y-4">
            {records.map((r) => (
              <li key={r.id}>
                <Row label="Blood" value={r.bloodType} />
                <Row label="Allergies" value={r.allergies} />
                <Row label="Conditions" value={r.conditions} />
                <Row label="Medications" value={r.medications} />
                {r.notes && <Row label="Notes" value={r.notes} />}

                <div className="mt-3 text-xs text-jewel-500">
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
 * @param {{ label: string; children: React.ReactNode; }} {
 *   label,
 *   children,
 * } - Description of {
 *   label,
 *   children,
 * }
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

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="text-sm">
      <span className="font-semibold text-jewel-800">{label}:</span>{" "}
      <span className="text-jewel-600">{value?.trim() || "\u2014"}</span>
    </div>
  );
}
