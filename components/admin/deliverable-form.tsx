"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Deliverable } from "@prisma/client";

type FormState = {
  slug: string;
  tier: number;
  title: string;
  priceCents: number;
  teaser: string;
  description: string;
  category: string;
  keyword: string;
  videoAddon: "NONE" | "ADD" | "INCLUDED";
  zoomAddon: "NONE" | "ADD" | "INCLUDED";
  active: boolean;
  sortOrder: number;
};

function toFormState(d?: Deliverable): FormState {
  return {
    slug: d?.slug ?? "",
    tier: d?.tier ?? 1,
    title: d?.title ?? "",
    priceCents: d?.priceCents ?? 0,
    teaser: d?.teaser ?? "",
    description: d?.description ?? "",
    category: d?.category ?? "",
    keyword: d?.keyword ?? "",
    videoAddon: (d?.videoAddon as FormState["videoAddon"]) ?? "NONE",
    zoomAddon: (d?.zoomAddon as FormState["zoomAddon"]) ?? "NONE",
    active: d?.active ?? true,
    sortOrder: d?.sortOrder ?? 0
  };
}

export function DeliverableForm({ deliverable }: { deliverable?: Deliverable }) {
  const router = useRouter();
  const isNew = !deliverable;
  const [form, setForm] = useState<FormState>(toFormState(deliverable));
  const [rawMode, setRawMode] = useState(false);
  const [rawText, setRawText] = useState(JSON.stringify(toFormState(deliverable), null, 2));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    let payload: FormState;
    if (rawMode) {
      try {
        payload = JSON.parse(rawText);
      } catch {
        setError("Raw JSON is not valid.");
        setSaving(false);
        return;
      }
    } else {
      payload = form;
    }

    try {
      const res = await fetch(isNew ? "/api/admin/deliverables" : `/api/admin/deliverables/${deliverable!.id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.formErrors?.join(", ") || data.error || "Save failed");
      router.push("/admin/deliverables");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="grid gap-5">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button type="button" onClick={() => setRawMode(false)} className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold ${!rawMode ? "bg-forest text-white" : "border border-line3"}`}>
            Form
          </button>
          <button
            type="button"
            onClick={() => {
              setRawText(JSON.stringify(form, null, 2));
              setRawMode(true);
            }}
            className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold ${rawMode ? "bg-forest text-white" : "border border-line3"}`}
          >
            Raw JSON
          </button>
        </div>
      </div>

      {rawMode ? (
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          rows={20}
          className="w-full rounded-xl border border-line3 p-4 font-mono text-[13px] outline-none focus:border-green"
        />
      ) : (
        <div className="grid gap-4 rounded-[20px] border border-line bg-white p-6">
          <Row label="Slug">
            <input required disabled={!isNew} value={form.slug} onChange={(e) => set("slug", e.target.value)} className="input" />
          </Row>
          <Row label="Title">
            <input required value={form.title} onChange={(e) => set("title", e.target.value)} className="input" />
          </Row>
          <div className="grid grid-cols-2 gap-4">
            <Row label="Tier">
              <select value={form.tier} onChange={(e) => set("tier", Number(e.target.value))} className="input">
                <option value={1}>Tier 1</option>
                <option value={2}>Tier 2</option>
                <option value={3}>Tier 3</option>
              </select>
            </Row>
            <Row label="Price (cents)">
              <input
                required
                type="number"
                min={0}
                value={form.priceCents}
                onChange={(e) => set("priceCents", Number(e.target.value))}
                className="input"
              />
            </Row>
          </div>
          <Row label="Teaser">
            <input required value={form.teaser} onChange={(e) => set("teaser", e.target.value)} className="input" />
          </Row>
          <Row label="Description">
            <textarea required rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} className="input resize-y" />
          </Row>
          <div className="grid grid-cols-2 gap-4">
            <Row label="Category">
              <input required value={form.category} onChange={(e) => set("category", e.target.value)} className="input" />
            </Row>
            <Row label="Placeholder-art keyword">
              <input required value={form.keyword} onChange={(e) => set("keyword", e.target.value)} className="input" />
            </Row>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Row label="Video add-on">
              <select value={form.videoAddon} onChange={(e) => set("videoAddon", e.target.value as FormState["videoAddon"])} className="input">
                <option value="NONE">None</option>
                <option value="ADD">Optional (+$35)</option>
                <option value="INCLUDED">Included in base price</option>
              </select>
            </Row>
            <Row label="Zoom add-on">
              <select value={form.zoomAddon} onChange={(e) => set("zoomAddon", e.target.value as FormState["zoomAddon"])} className="input">
                <option value="NONE">None</option>
                <option value="ADD">Optional (+$45)</option>
                <option value="INCLUDED">Included in base price</option>
              </select>
            </Row>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Row label="Sort order">
              <input type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} className="input" />
            </Row>
            <label className="flex items-center gap-2 pt-6 text-[14px]">
              <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="h-[18px] w-[18px] accent-green" />
              Active (visible on the site)
            </label>
          </div>
        </div>
      )}

      {error && <p className="text-[13.5px] text-red-700">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="rounded-xl bg-cyan px-6 py-3 font-semibold text-cyan-ink disabled:opacity-60">
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 11px;
          border: 1px solid #e4e0d2;
          padding: 12px 14px;
          outline: none;
        }
        .input:focus {
          border-color: #2d7b5f;
        }
      `}</style>
    </form>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-[6px] text-[13px] font-semibold text-muted">{label}</div>
      {children}
    </div>
  );
}
