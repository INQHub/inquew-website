"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/cart-context";
import { useTrackEvent } from "@/components/use-track-event";
import { formatCents } from "@/lib/money";
import type { PublicDeliverable } from "@/lib/types";

type Statement = { id: string; text: string; angle: string | null };

const RECORD_SECONDS_LIMIT = 120;

export default function IntakePage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [declined, setDeclined] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [recording, setRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [camError, setCamError] = useState<string | null>(null);

  const [transcribing, setTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);

  const [statements, setStatements] = useState<Statement[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [customText, setCustomText] = useState("");
  const [regenerating, setRegenerating] = useState(false);

  const [recommended, setRecommended] = useState<PublicDeliverable[]>([]);
  const [chosenText, setChosenText] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const cart = useCart();
  const track = useTrackEvent();

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function consent() {
    track("intake_started");
    const res = await fetch("/api/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consent: true })
    });
    const data = await res.json();
    setSessionId(data.id);
    track("intake_consented");
    setStep(2);
  }

  function decline() {
    track("intake_declined");
    fetch("/api/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consent: false })
    }).catch(() => {});
    setDeclined(true);
  }

  function restart() {
    setDeclined(false);
    setStep(1);
  }

  async function startRec() {
    setCamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        void submitRecording(blob, "intake-recording.webm");
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setRecTime(0);
      track("recording_started");
      timerRef.current = setInterval(() => {
        setRecTime((t) => {
          if (t + 1 >= RECORD_SECONDS_LIMIT) {
            stopRec();
            return RECORD_SECONDS_LIMIT;
          }
          return t + 1;
        });
      }, 1000);
    } catch {
      setCamError("Camera or microphone permission was denied. You can upload a file instead.");
    }
  }

  function stopRec() {
    clearInterval(timerRef.current);
    setRecording(false);
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  }

  function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void submitRecording(file, file.name);
  }

  async function submitRecording(blob: Blob, fileName: string) {
    if (!sessionId) return;
    setStep(3);
    setTranscribing(true);
    setTranscribeError(null);
    try {
      const formData = new FormData();
      formData.append("video", blob, fileName);
      const res = await fetch(`/api/intake/${sessionId}/transcribe`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Transcription failed");
      setStatements(data.statements);
      setRecommended(data.recommended);
      track("recording_completed");
      setStep(4);
    } catch (err) {
      setTranscribeError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setTranscribing(false);
    }
  }

  async function regenerate() {
    if (!sessionId) return;
    setRegenerating(true);
    try {
      const res = await fetch(`/api/intake/${sessionId}/statements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regenerate" })
      });
      const data = await res.json();
      if (res.ok) {
        setStatements(data.statements);
        setRecommended(data.recommended);
        setPicked(null);
      }
    } finally {
      setRegenerating(false);
    }
  }

  async function confirmStatement() {
    if (!sessionId) return;
    if (editing && customText.trim()) {
      const res = await fetch(`/api/intake/${sessionId}/statements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "custom", text: customText.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setChosenText(data.text);
        track("statement_selected", { custom: true });
        setStep(5);
        window.scrollTo(0, 0);
      }
      return;
    }
    if (picked) {
      const res = await fetch(`/api/intake/${sessionId}/statements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "select", statementId: picked })
      });
      const data = await res.json();
      if (res.ok) {
        setChosenText(data.text);
        track("statement_selected", { custom: false });
        setStep(5);
        window.scrollTo(0, 0);
      }
    }
  }

  const canConfirm = picked !== null || (editing && customText.trim().length > 0);

  return (
    <section className="mx-auto max-w-[820px] px-7 pb-20 pt-14">
      <div className="mb-[34px] flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="h-[5px] flex-1 rounded-full" style={{ background: n <= step ? "#13E2E9" : "#EFEDE2" }} />
        ))}
      </div>

      {step === 1 && !declined && (
        <div>
          <span className="text-[12.5px] font-semibold uppercase tracking-[0.08em] text-olive">Step 1 of 5</span>
          <h1 className="mt-3 text-[38px] font-bold">Before we start, here&apos;s exactly what happens to your video</h1>
          <div className="mt-7 grid gap-[18px] rounded-[20px] border border-line bg-white p-7">
            <Notice title="Transcript only.">
              Your video is converted to text. No facial or voice biometric data is generated or stored.
            </Notice>
            <Notice title="AI is limited to problem statements.">
              It reads the transcript and drafts three candidate framings. That&apos;s the whole of its role in what
              you receive.
            </Notice>
            <Notice title="A human consultant creates every deliverable.">
              AI-assisted, never AI-authored, and reviewed before release at every tier.
            </Notice>
            <Notice title="Sub-processors.">
              Transcription, storage, and payment are handled by vendors under data processing agreements. Stored
              data is encrypted at rest.
            </Notice>
          </div>
          <div className="mt-[26px] flex flex-wrap gap-[14px]">
            <button onClick={consent} className="rounded-[13px] bg-cyan px-[26px] py-4 text-[16px] font-semibold text-cyan-ink hover:bg-cyan-hover">
              I consent — continue
            </button>
            <button onClick={decline} className="rounded-[13px] border border-[#CFD8B8] bg-white px-[26px] py-4 text-[16px] font-semibold">
              No thanks — talk to a human instead
            </button>
          </div>
        </div>
      )}

      {declined && (
        <div className="rounded-[22px] border border-line bg-white p-11 text-center">
          <h1 className="text-[34px] font-bold">The manual path it is</h1>
          <p className="mx-auto mt-4 max-w-[44ch] text-[17px] text-muted">
            Nothing will be recorded or transcribed. A consultant will take your problem down in a conversation
            instead, and you can still buy from the same menu at the same prices.
          </p>
          <div className="mt-[30px] flex flex-wrap justify-center gap-[14px]">
            <Link href="/contact" className="rounded-xl bg-cyan px-6 py-[15px] font-semibold text-cyan-ink">
              Contact a consultant
            </Link>
            <Link href="/deliverables" className="rounded-xl border border-[#CFD8B8] bg-white px-6 py-[15px] font-semibold">
              Browse the menu
            </Link>
            <button onClick={restart} className="rounded-xl px-6 py-[15px] font-semibold text-muted">
              Back to the notice
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <span className="text-[12.5px] font-semibold uppercase tracking-[0.08em] text-olive">Step 2 of 5</span>
          <h1 className="mt-3 text-[38px] font-bold">Record two minutes about your problem</h1>
          <p className="mt-[14px] text-[17px] text-muted">
            Talk the way you&apos;d explain it to a friend. What&apos;s slow, what breaks, what you wish worked. No
            vocabulary required.
          </p>
          <div className="mt-7 rounded-[22px] bg-forest p-[22px]">
            <div className="relative flex aspect-[16/10] flex-col items-center justify-center gap-[14px] overflow-hidden rounded-2xl bg-[repeating-linear-gradient(135deg,#4E5F12_0_10px,#475709_10px_20px)]">
              <video ref={videoRef} muted playsInline className={`absolute inset-0 h-full w-full object-cover ${recording ? "block" : "hidden"}`} />
              {recording && (
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/35 px-3 py-[6px]">
                  <span className="h-[9px] w-[9px] animate-pulse-dot rounded-full bg-[#FF6B6B]" />
                  <span className="font-mono text-[13px] font-semibold text-[#F3F5E8]">
                    {String(Math.floor(recTime / 60))}:{String(recTime % 60).padStart(2, "0")} / 2:00
                  </span>
                </div>
              )}
              {!recording && (
                <>
                  <span className="font-mono text-[12px] tracking-[0.04em] text-[#C9D6A0]">camera preview</span>
                  <p className="max-w-[32ch] text-center text-[15px] text-[#E3EBC8]">
                    Your camera preview appears here once you grant permission.
                  </p>
                </>
              )}
            </div>
            <div className="mt-[18px] flex flex-wrap items-center gap-3">
              {!recording && (
                <button onClick={startRec} className="rounded-xl bg-cyan px-6 py-[14px] font-semibold text-cyan-ink">
                  Start recording
                </button>
              )}
              {recording && (
                <button onClick={stopRec} className="rounded-xl bg-white px-6 py-[14px] font-semibold text-ink">
                  Stop and submit
                </button>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border border-[#6E7F3A] px-5 py-[14px] text-[14.5px] font-semibold text-[#E3EBC8]"
              >
                Upload a file instead
              </button>
              <input ref={fileInputRef} type="file" accept="video/*,audio/*" className="hidden" onChange={onFileChosen} />
              <span className="ml-auto text-[13px] text-[#B8C795]">
                Camera and microphone permission is requested only when you press record.
              </span>
            </div>
            {camError && <p className="mt-3 text-[13.5px] text-[#FFB4B4]">{camError}</p>}
          </div>
          <p className="mt-[18px] text-[13.5px] text-faint">
            Recording from a phone works the same way — the controls stack and the frame fills the screen.
          </p>
        </div>
      )}

      {step === 3 && (
        <div className="py-[60px] text-center">
          <span className="text-[12.5px] font-semibold uppercase tracking-[0.08em] text-olive">Step 3 of 5</span>
          <h1 className="mt-3 text-[34px] font-bold">Transcribing your video</h1>
          <p className="mt-3 text-muted">Converting speech to text, then drafting three candidate problem statements.</p>
          {transcribing && (
            <div className="mx-auto mt-8 h-2 max-w-[420px] overflow-hidden rounded-full bg-[#EFEDE2]">
              <div className="animate-bar-grow h-full bg-cyan" />
            </div>
          )}
          {transcribeError && (
            <div className="mx-auto mt-8 max-w-[440px] rounded-2xl border border-[#E8C3C3] bg-[#FDF2F2] p-5 text-left">
              <p className="text-[14.5px] font-semibold text-[#A64B4B]">{transcribeError}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={() => setStep(2)} className="rounded-lg border border-line3 px-4 py-2 text-[13.5px] font-semibold">
                  Try recording again
                </button>
                <Link href="/contact" className="rounded-lg bg-cyan px-4 py-2 text-[13.5px] font-semibold text-cyan-ink">
                  Talk to a human instead
                </Link>
              </div>
            </div>
          )}
          <p className="mt-[14px] font-mono text-[12px] text-faint">no biometric embeddings generated or stored</p>
        </div>
      )}

      {step === 4 && (
        <div>
          <span className="text-[12.5px] font-semibold uppercase tracking-[0.08em] text-olive">Step 4 of 5</span>
          <h1 className="mt-3 text-[38px] font-bold">Which of these is your actual problem?</h1>
          <p className="mt-[14px] text-[17px] text-muted">
            Three framings drafted from your transcript. Pick the closest one, edit it, or ask for three new ones.
          </p>
          <div className="mt-7 grid gap-[14px]">
            {statements.map((s, i) => {
              const on = picked === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setPicked(s.id);
                    setEditing(false);
                  }}
                  className="rounded-[18px] border-2 bg-white p-6 text-left"
                  style={{
                    borderColor: on ? "#2D7B5F" : "#E9E5D8",
                    boxShadow: on ? "0 8px 26px rgba(45,123,95,.16)" : "0 1px 2px rgba(66,82,6,.04)"
                  }}
                >
                  <div className="flex items-center gap-[10px]">
                    <span
                      className="h-[22px] w-[22px] flex-shrink-0 rounded-full border-2"
                      style={{ borderColor: on ? "#2D7B5F" : "#CFCBB8", background: on ? "#2D7B5F" : "#FFFFFF" }}
                    />
                    <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-faint">Option {i + 1}</span>
                  </div>
                  <p className="mt-3 font-display text-[19px] font-medium leading-[1.4]">{s.text}</p>
                  {s.angle && <p className="mt-[10px] text-[13.5px] text-faint">{s.angle}</p>}
                </button>
              );
            })}
          </div>
          <div className="mt-[22px] flex flex-wrap gap-3">
            <button
              onClick={regenerate}
              disabled={regenerating}
              className="rounded-xl border border-line3 bg-white px-5 py-[13px] text-[14.5px] font-semibold disabled:opacity-60"
            >
              {regenerating ? "Generating…" : "Generate three new options"}
            </button>
            <button
              onClick={() => {
                setEditing((e) => !e);
                setPicked(null);
              }}
              className="rounded-xl border border-line3 bg-white px-5 py-[13px] text-[14.5px] font-semibold"
            >
              Write my own instead
            </button>
          </div>
          {editing && (
            <textarea
              rows={3}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="In my own words, the problem is…"
              className="mt-4 w-full resize-y rounded-2xl border border-line3 p-4 text-[16px] outline-none focus:border-green"
            />
          )}
          <div className="mt-[26px]">
            <button
              onClick={confirmStatement}
              disabled={!canConfirm}
              className="rounded-[13px] px-7 py-4 text-[16px] font-semibold"
              style={{ background: canConfirm ? "#13E2E9" : "#EFEDE2", color: canConfirm ? "#0B2E22" : "#A8A48F" }}
            >
              Use this problem statement
            </button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div>
          <span className="text-[12.5px] font-semibold uppercase tracking-[0.08em] text-olive">Step 5 of 5</span>
          <h1 className="mt-3 text-[38px] font-bold">Recommended for this problem</h1>
          <div className="mt-5 rounded-2xl border border-green-border bg-green-tint p-5">
            <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-green">Your problem statement</div>
            <p className="mt-2 font-display text-[18px] font-medium">{chosenText}</p>
          </div>
          <p className="mt-[22px] text-[17px] text-muted">
            Deliverables from the menu that answer it directly. Add what you want — or open the full menu.
          </p>
          <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-[18px]">
            {recommended.map((it) => (
              <RecommendedCard
                key={it.id}
                item={it}
                onAdd={() => {
                  if (cart.add(it.id)) track("add_to_cart", { deliverableId: it.id, source: "intake_recommendation" });
                }}
              />
            ))}
          </div>
          <div className="mt-[30px] flex flex-wrap gap-[14px]">
            <button onClick={() => router.push("/cart")} className="rounded-[13px] bg-forest px-[26px] py-4 text-[16px] font-semibold text-[#F3F5E8]">
              Go to cart
            </button>
            <Link href="/deliverables" className="rounded-[13px] border border-[#CFD8B8] bg-white px-[26px] py-4 text-[16px] font-semibold">
              See all deliverables
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-[14px]">
      <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green" />
      <div>
        <strong className="font-semibold">{title}</strong> <span className="text-muted">{children}</span>
      </div>
    </div>
  );
}

function RecommendedCard({ item, onAdd }: { item: PublicDeliverable; onAdd: () => void }) {
  return (
    <div className="flex flex-col rounded-[18px] border border-line bg-white p-[18px]">
      <div className="flex items-center gap-2">
        <span className="rounded-full px-[9px] py-[3px] text-[10.5px] font-bold text-white" style={{ background: "#2D7B5F" }}>
          {item.tier === 1 ? "Tier 1" : item.tier === 2 ? "Tier 2" : "Tier 3"}
        </span>
        <span className="text-[11.5px] text-faint">{item.category}</span>
      </div>
      <h3 className="mt-[10px] text-[17px] font-semibold">{item.title}</h3>
      <p className="mt-[6px] text-[14px] text-muted">{item.teaser}</p>
      <div className="mt-auto flex items-center justify-between pt-4">
        <span className="font-display text-[21px] font-bold text-green">{formatCents(item.priceCents)}</span>
        <button onClick={onAdd} className="rounded-[10px] bg-cyan px-[15px] py-[10px] text-[13.5px] font-semibold text-cyan-ink">
          Add
        </button>
      </div>
    </div>
  );
}
