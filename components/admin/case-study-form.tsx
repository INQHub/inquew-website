"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { INDUSTRIES } from "@/lib/diagnostic";

type Values = {
  title: string;
  slug: string;
  industry: string;
  summary: string;
  problem: string;
  result: string;
  body: string;
  coverKey: string | null;
  published: boolean;
};

const EMPTY: Values = { title: "", slug: "", industry: INDUSTRIES[0], summary: "", problem: "", result: "", body: "", coverKey: null, published: false };

const input = "w-full rounded-xl border border-line3 bg-white px-4 py-3 text-[15px] outline-none focus:border-green";

export function CaseStudyForm({ id, initial, initialCoverUrl }: { id?: string; initial?: Values; initialCoverUrl?: string | null }) {
  const router = useRouter();
  const [v, setV] = useState<Values>(initial ?? EMPTY);
  const [coverUrl, setCoverUrl] = useState<string | null>(initialCoverUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof Values>(k: K, val: Values[K]) => {
    setSaved(false);
    setV((prev) => ({ ...prev, [k]: val }));
  };

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 4000);
    return () => clearTimeout(t);
  }, [saved]);

  async function uploadCover(file: File) {
    setError(null);
    setUploading(true);
    try {
      const startRes = await fetch("/api/admin/case-studies/cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", fileName: file.name, sizeBytes: file.size })
      });
      const start = await startRes.json().catch(() => null);
      if (!startRes.ok) throw new Error(start?.error || "Could not start the upload");
      const supabase = getSupabaseBrowser();
      if (!supabase) throw new Error("File storage isn't configured in this environment.");
      const { error: upErr } = await supabase.storage.from(start.bucket).uploadToSignedUrl(start.path, start.token, file);
      if (upErr) throw new Error("The image didn't upload. Please try again.");
      set("coverKey", start.path);
      setCoverUrl(URL.createObjectURL(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save(publish?: boolean) {
    const payload = { ...v, published: publish ?? v.published };
    setSaving(true);
    setError(null);
    setErrorField(null);
    try {
      const res = await fetch(id ? `/api/admin/case-studies/${id}` : "/api/admin/case-studies", {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErrorField(data?.field ?? null);
        throw new Error(data?.error || "Could not save");
      }
      setV({ ...payload, slug: data.slug });
      setSaved(true);
      if (!id) router.push(`/admin/case-studies/${data.id}`);
      else router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!id || !confirm("Delete this case study? This removes it from the website and can't be undone.")) return;
    setSaving(true);
    const res = await fetch(`/api/admin/case-studies/${id}`, { method: "DELETE" });
    setSaving(false);
    if (!res.ok) return setError("Could not delete");
    router.push("/admin/case-studies");
    router.refresh();
  }

  const fieldError = (f: string) => (errorField === f ? "border-[#9B2C2C]" : "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
    >
      <div className="grid gap-5 rounded-[20px] border border-line bg-white p-6">
        <Field label="Title" htmlFor="cs-title">
          <input id="cs-title" className={`${input} ${fieldError("title")}`} value={v.title} onChange={(e) => set("title", e.target.value)} required maxLength={160} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Industry" htmlFor="cs-industry">
            <select id="cs-industry" className={input} value={v.industry} onChange={(e) => set("industry", e.target.value)}>
              {[...new Set([...INDUSTRIES, v.industry])].map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
          </Field>
          <Field label="Web address" htmlFor="cs-slug" hint={`/case-studies/${v.slug || "made-from-the-title"}`}>
            <input id="cs-slug" className={`${input} ${fieldError("slug")}`} value={v.slug} onChange={(e) => set("slug", e.target.value)} placeholder="Leave blank to use the title" maxLength={80} />
          </Field>
        </div>
        <Field label="Summary" htmlFor="cs-summary" hint="One or two sentences for the case study card.">
          <textarea id="cs-summary" rows={2} className={`${input} ${fieldError("summary")}`} value={v.summary} onChange={(e) => set("summary", e.target.value)} required maxLength={400} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="The problem" htmlFor="cs-problem">
            <textarea id="cs-problem" rows={4} className={`${input} ${fieldError("problem")}`} value={v.problem} onChange={(e) => set("problem", e.target.value)} required maxLength={2000} />
          </Field>
          <Field label="The result" htmlFor="cs-result">
            <textarea id="cs-result" rows={4} className={`${input} ${fieldError("result")}`} value={v.result} onChange={(e) => set("result", e.target.value)} required maxLength={2000} />
          </Field>
        </div>
        <Field label="Full story" htmlFor="cs-body" hint="Plain text. Leave a blank line between paragraphs.">
          <textarea id="cs-body" rows={16} className={`${input} ${fieldError("body")}`} value={v.body} onChange={(e) => set("body", e.target.value)} required maxLength={40000} />
        </Field>
      </div>

      <aside className="grid content-start gap-5">
        <div className="grid gap-3 rounded-[20px] border border-line bg-white p-6">
          <h2 className="text-[17px] font-semibold">Cover image</h2>
          <div className="flex aspect-[16/10] items-center justify-center overflow-hidden rounded-[14px] bg-green-tint">
            {coverUrl ? <img src={coverUrl} alt="Cover preview" className="h-full w-full object-cover" /> : <img src="/assets/mascots/city.png" alt="" className="h-[80px] w-auto opacity-70" />}
          </div>
          <label className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-full border border-green px-5 text-[14px] font-semibold text-green hover:bg-green-tint">
            {uploading ? "Uploading…" : coverUrl ? "Replace image" : "Upload image"}
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadCover(f);
                e.target.value = "";
              }}
            />
          </label>
          {v.coverKey && (
            <button
              type="button"
              className="text-[13px] font-semibold text-[#9B2C2C]"
              onClick={() => {
                set("coverKey", null);
                setCoverUrl(null);
              }}
            >
              Remove image
            </button>
          )}
          <p className="text-[12.5px] text-faint">PNG, JPG or WebP, up to 8 MB. Only use photos the client approved.</p>
        </div>

        <div className="grid gap-3 rounded-[20px] border border-line bg-white p-6">
          <h2 className="text-[17px] font-semibold">Publishing</h2>
          <label className="flex items-center gap-3 text-[14.5px]">
            <input type="checkbox" checked={v.published} onChange={(e) => set("published", e.target.checked)} className="h-5 w-5 accent-[#2D7B5F]" />
            Published on the website
          </label>
          <p className="text-[12.5px] text-faint">Publish only after the client has approved the final text.</p>
          <button type="submit" disabled={saving || uploading} className="min-h-[46px] rounded-full bg-forest px-5 font-semibold text-white disabled:opacity-60">
            {saving ? "Saving…" : "Save"}
          </button>
          {!v.published && (
            <button type="button" disabled={saving || uploading} onClick={() => save(true)} className="min-h-[46px] rounded-full bg-sky px-5 font-semibold text-forest disabled:opacity-60">
              Save and publish
            </button>
          )}
          {v.published && id && (
            <a href={`/case-studies/${v.slug}`} target="_blank" rel="noopener" className="text-center text-[13.5px] font-semibold text-green underline">
              View on site
            </a>
          )}
          {saved && <p role="status" className="text-[13px] font-semibold text-green">Saved.</p>}
          {error && <p role="alert" className="text-[13px] text-[#9B2C2C]">{error}</p>}
          {id && (
            <button type="button" onClick={remove} disabled={saving} className="mt-2 text-[13px] font-semibold text-[#9B2C2C]">
              Delete case study
            </button>
          )}
        </div>
      </aside>
    </form>
  );
}

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-[6px]">
      <label htmlFor={htmlFor} className="text-[14px] font-semibold text-[#36423B]">
        {label}
      </label>
      {children}
      {hint && <span className="text-[12.5px] text-faint">{hint}</span>}
    </div>
  );
}
