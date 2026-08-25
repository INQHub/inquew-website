"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCents } from "@/lib/money";
import { signOffLabel } from "@/lib/name";

type Line = {
  id: string;
  deliverableId: string;
  priceCentsAtOrder: number;
  videoAddon: boolean;
  zoomAddon: boolean;
  editsIncluded: number;
  editsUsed: number;
  completedAt: string | null;
  completedBy: { name: string | null; email: string } | null;
  deliverable: { title: string; tier: number };
  files: { id: string; fileName: string; createdAt: string }[];
};

type OrderData = {
  id: string;
  displayId: string;
  status: string;
  progressPct: number;
  deliveryMethod: string;
  contactName: string | null;
  contactEmail: string | null;
  businessName: string | null;
  subtotalCents: number;
  user: { email: string; name: string | null };
  lines: Line[];
};

const STATUSES = ["PENDING_PAYMENT", "PAID", "ASSIGNED", "IN_REVIEW", "AWAITING_CLIENT_REVIEW", "DELIVERED", "CANCELLED"];

export function OrderAdminPanel({ order, currentAdminName }: { order: OrderData; currentAdminName: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const [progressPct, setProgressPct] = useState(order.progressPct);
  const [saving, setSaving] = useState(false);
  const [uploadingLine, setUploadingLine] = useState<string | null>(null);
  const [signingOffLine, setSigningOffLine] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  async function saveStatus() {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, progressPct })
    });
    setSaving(false);
    if (res.ok) {
      setMessage("Saved.");
      router.refresh();
    } else {
      setMessage("Save failed.");
    }
  }

  async function saveEdits(lineId: string, editsUsed: number) {
    await fetch(`/api/admin/orders/${order.id}/lines/${lineId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editsUsed })
    });
    router.refresh();
  }

  async function uploadFile(lineId: string, file: File) {
    setUploadingLine(lineId);
    setMessage(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("orderLineId", lineId);
    const res = await fetch(`/api/admin/orders/${order.id}/files`, { method: "POST", body: formData });
    const data = await res.json();
    setUploadingLine(null);
    if (!res.ok) {
      setMessage(data.message || data.error || "Upload failed");
      return;
    }
    router.refresh();
  }

  async function deleteFile(fileId: string) {
    if (!confirm("Delete this file?")) return;
    await fetch(`/api/admin/orders/${order.id}/files/${fileId}`, { method: "DELETE" });
    router.refresh();
  }

  async function toggleSignOff(lineId: string, signedOff: boolean) {
    setSigningOffLine(lineId);
    await fetch(`/api/admin/orders/${order.id}/lines/${lineId}/sign-off`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signedOff })
    });
    setSigningOffLine(null);
    router.refresh();
  }

  return (
    <div className="grid gap-5">
      <div className="rounded-[20px] border border-line bg-white p-6">
        <h3 className="text-[18px] font-semibold">Contact</h3>
        <div className="mt-3 grid gap-1 text-[14px] text-muted">
          <div>{order.contactName ?? order.user.name} · {order.contactEmail ?? order.user.email}</div>
          {order.businessName && <div>{order.businessName}</div>}
          <div>Delivery: {order.deliveryMethod === "EMAIL" ? "Direct email" : "Platform dashboard"}</div>
          <div className="font-display text-[20px] font-bold text-green">{formatCents(order.subtotalCents)}</div>
        </div>
      </div>

      <div className="rounded-[20px] border border-line bg-white p-6">
        <h3 className="text-[18px] font-semibold">Status</h3>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-[10px] border border-line3 px-3 py-2">
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-[13.5px] text-muted">
            Progress
            <input
              type="number"
              min={0}
              max={100}
              value={progressPct}
              onChange={(e) => setProgressPct(Number(e.target.value))}
              className="w-[70px] rounded-[10px] border border-line3 px-2 py-2"
            />
            %
          </label>
          <button onClick={saveStatus} disabled={saving} className="rounded-[10px] bg-cyan px-4 py-2 text-[13.5px] font-semibold text-cyan-ink disabled:opacity-60">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
        {message && <p className="mt-2 text-[13px] text-muted">{message}</p>}
      </div>

      <div className="grid gap-4">
        {order.lines.map((line) => (
          <div key={line.id} className="rounded-[20px] border border-line bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-[17px] font-semibold">{line.deliverable.title}</h3>
              <label className="flex items-center gap-2 text-[13.5px] text-muted">
                Edits used
                <input
                  type="number"
                  min={0}
                  defaultValue={line.editsUsed}
                  onBlur={(e) => saveEdits(line.id, Number(e.target.value))}
                  className="w-[60px] rounded-[10px] border border-line3 px-2 py-1"
                />
                / {line.editsIncluded}
              </label>
            </div>

            <div className="mt-4 grid gap-2">
              {line.files.map((f) => (
                <div key={f.id} className="flex items-center justify-between rounded-lg border border-line2 bg-sand px-3 py-2 text-[13.5px]">
                  <span>{f.fileName}</span>
                  <button onClick={() => deleteFile(f.id)} className="text-[12px] text-red-700 underline">
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-3">
              <input
                ref={(el) => {
                  fileInputs.current[line.id] = el;
                }}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadFile(line.id, file);
                  e.target.value = "";
                }}
              />
              <button
                onClick={() => fileInputs.current[line.id]?.click()}
                disabled={uploadingLine === line.id}
                className="rounded-[10px] border border-line3 px-4 py-2 text-[13.5px] font-semibold disabled:opacity-60"
              >
                {uploadingLine === line.id ? "Uploading…" : "Upload finished file"}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#F3F1E7] pt-3">
              {line.completedAt ? (
                <span className="text-[13px] text-muted">
                  Signed off by <strong>{signOffLabel(line.completedBy?.name)}</strong> on{" "}
                  {new Date(line.completedAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
                </span>
              ) : (
                <span className="text-[13px] text-faint">Not signed off yet</span>
              )}
              <button
                onClick={() => toggleSignOff(line.id, !line.completedAt)}
                disabled={signingOffLine === line.id}
                className="rounded-[10px] border border-line3 px-4 py-2 text-[13.5px] font-semibold disabled:opacity-60"
              >
                {signingOffLine === line.id
                  ? "Saving…"
                  : line.completedAt
                    ? "Undo sign-off"
                    : `Sign off as ${signOffLabel(currentAdminName)}`}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
