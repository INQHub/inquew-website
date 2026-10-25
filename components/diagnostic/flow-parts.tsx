"use client";

import { useEffect, useRef, useState } from "react";

export const FLOW_STEPS = ["Consent", "Record", "Choose problem", "Questions", "Details", "Results"] as const;

/** Pill-style tracker shown at the top of every diagnostic screen. */
export function StepTracker({ current }: { current: number }) {
  return (
    <ol aria-label="Diagnostic steps" className="mb-8 flex flex-wrap gap-[6px] text-[13px]">
      {FLOW_STEPS.map((label, i) => {
        const done = i < current;
        const now = i === current;
        return (
          <li
            key={label}
            aria-current={now ? "step" : undefined}
            className={`rounded-full px-3 py-[6px] ${
              now ? "bg-forest font-semibold text-white" : done ? "bg-green-tint text-forest" : "bg-line text-[#36423B]"
            }`}
          >
            {i + 1} {label}
          </li>
        );
      })}
    </ol>
  );
}

const THINKING_LINES = [
  "Inquew is reading your transcript…",
  "Inquew is thinking through your problem…",
  "Inquew is diagnosing what's really going on…",
  "Lining up the questions that matter most…"
];
const ENCOURAGEMENT = [
  "Naming the problem is the hardest step, and you just took it.",
  "Small fixes in the right place save the most time.",
  "Businesses like yours fix this every day. You're in good company."
];

/** Loading state for every AI wait: pulsing mascot, shimmer bar, rotating status lines. */
export function Thinking({ lines = THINKING_LINES }: { lines?: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => n + 1), 3500);
    return () => clearInterval(t);
  }, []);
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-6 py-10 text-center">
      <div className="animate-sprout flex h-[200px] w-[200px] items-center justify-center rounded-full border border-line bg-white">
        <img src="/assets/mascots/flame.png" alt="" className="h-[140px] w-auto" />
      </div>
      <h1 className="text-[28px] font-extrabold">{lines[i % lines.length]}</h1>
      <div className="relative h-[10px] w-full max-w-[420px] overflow-hidden rounded-full bg-line">
        <div className="animate-shimmer absolute left-0 top-0 h-full w-[40%] rounded-full bg-sky" />
      </div>
      <p className="rounded-2xl bg-olive-tint px-5 py-4 text-[#36423B]">{ENCOURAGEMENT[i % ENCOURAGEMENT.length]}</p>
    </div>
  );
}

/** Shown next to every record button. */
export function RecordingDisclaimer() {
  return (
    <div className="flex items-start gap-3 text-[13.5px] text-muted">
      <LockIcon />
      <span>
        Recordings and transcripts are stored encrypted in your business library and used only to build your
        deliverables. Inquew never uses your data to train AI, and our AI providers&apos; API terms don&apos;t allow it
        either. We never create voiceprints. You can delete them anytime.{" "}
        <a href="/privacy" target="_blank" rel="noreferrer">
          Learn more
        </a>
      </span>
    </div>
  );
}

export function LockIcon({ className = "mt-[2px] h-5 w-5 flex-shrink-0" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="#2D7B5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

const ANSWER_SECONDS_LIMIT = 120;

/**
 * Records a spoken answer, sends the audio to be transcribed, and hands back the text so
 * the client can review and edit it before moving on.
 */
export function AnswerRecorder({ intakeId, onText }: { intakeId: string; onText: (text: string) => void }) {
  const [state, setState] = useState<"idle" | "recording" | "transcribing">("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        void upload(new Blob(chunksRef.current, { type: mimeType }));
      };
      recorderRef.current = recorder;
      recorder.start();
      setState("recording");
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= ANSWER_SECONDS_LIMIT) stop();
          return s + 1;
        });
      }, 1000);
    } catch {
      setError("Microphone permission was denied. You can type your answer instead.");
    }
  }

  function stop() {
    clearInterval(timerRef.current);
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
  }

  async function upload(blob: Blob) {
    setState("transcribing");
    try {
      const form = new FormData();
      form.append("audio", blob, "answer.webm");
      const res = await fetch(`/api/intake/${intakeId}/answer-audio`, { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.text) throw new Error(data?.error || "We couldn't transcribe that. Please type your answer.");
      onText(data.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setState("idle");
    }
  }

  return (
    <div className="grid gap-2">
      {state === "recording" ? (
        <button
          type="button"
          onClick={stop}
          className="inline-flex min-h-[44px] items-center gap-2 justify-self-start rounded-full bg-forest px-5 py-3 font-semibold text-white"
        >
          <span className="animate-pulse-dot h-[9px] w-[9px] rounded-full bg-[#FF6B6B]" />
          Stop recording ({Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")})
        </button>
      ) : (
        <button
          type="button"
          onClick={start}
          disabled={state === "transcribing"}
          className="inline-flex min-h-[44px] items-center gap-2 justify-self-start rounded-full border border-line3 bg-white px-5 py-3 font-semibold text-forest disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <path d="M12 18v3" />
          </svg>
          {state === "transcribing" ? "Turning your answer into text…" : "Record your answer instead"}
        </button>
      )}
      {error && <p className="text-[13.5px] text-[#9B2C2C]">{error}</p>}
    </div>
  );
}
