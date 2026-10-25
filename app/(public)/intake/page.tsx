"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useTrackEvent } from "@/components/use-track-event";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { INDUSTRIES, DEPARTMENTS } from "@/lib/diagnostic";
import { StepTracker, Thinking, RecordingDisclaimer, AnswerRecorder, LockIcon } from "@/components/diagnostic/flow-parts";

type Statement = { id: string; text: string; angle: string | null };

const RECORD_SECONDS_LIMIT = 120;

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * A full-length recording easily exceeds Vercel's ~4.5MB serverless request-body
 * limit, which used to make the upload fail with a non-JSON "Request Entity Too
 * Large" response that broke on res.json(). The full video is archived straight to
 * Supabase Storage via a signed URL instead (bypasses that limit entirely).
 *
 * Separately, Whisper only needs audio, and it hard-caps uploads at 25MB — a couple
 * of minutes of webcam video (video + audio track) blows past that easily and the
 * oversized request gets abruptly reset instead of cleanly rejected. So for a live
 * recording, `audioBlob` is a much smaller audio-only clip split off client-side
 * specifically for transcription, while `videoBlob` (the full recording) still goes
 * to storage for the record. The manual "upload a file instead" path has no way to
 * split out audio, so it transcribes the file as-is (referencing it in storage when
 * possible, to at least avoid Vercel's body-size limit).
 */
async function uploadAndTranscribe(
  sessionId: string,
  videoBlob: Blob,
  fileName: string,
  audioBlob?: Blob
): Promise<Response> {
  const supabase = getSupabaseBrowser();
  let videoPath: string | null = null;

  if (supabase) {
    try {
      const urlRes = await fetch(`/api/intake/${sessionId}/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName })
      });
      if (urlRes.ok) {
        const { bucket, path, token } = await urlRes.json();
        const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(path, token, videoBlob);
        if (!error) videoPath = path;
        else console.error("video archive upload failed (non-fatal)", error);
      }
    } catch (err) {
      console.error("signed upload flow failed (non-fatal)", err);
    }
  }

  if (audioBlob) {
    const formData = new FormData();
    formData.append("video", audioBlob, "intake-audio.webm");
    if (videoPath) formData.append("videoPath", videoPath);
    return fetch(`/api/intake/${sessionId}/transcribe`, { method: "POST", body: formData });
  }

  if (videoPath) {
    return fetch(`/api/intake/${sessionId}/transcribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: videoPath })
    });
  }

  const formData = new FormData();
  formData.append("video", videoBlob, fileName);
  return fetch(`/api/intake/${sessionId}/transcribe`, { method: "POST", body: formData });
}


type Step = "consent" | "record" | "transcribing" | "statement" | "loadingQuestions" | "questions" | "details" | "account" | "finishing";

const TRACKER_INDEX: Record<Step, number> = {
  consent: 0,
  record: 1,
  transcribing: 1,
  statement: 2,
  loadingQuestions: 3,
  questions: 3,
  details: 4,
  account: 5,
  finishing: 5
};

const btnPrimary =
  "inline-flex min-h-[44px] items-center justify-center rounded-full bg-green px-7 py-[14px] text-[16px] font-semibold text-white hover:bg-forest disabled:cursor-not-allowed disabled:bg-[#D5DBD7] disabled:text-muted";
const btnSecondary =
  "inline-flex min-h-[44px] items-center justify-center rounded-full border border-line3 bg-white px-6 py-[13px] text-[15px] font-semibold text-forest hover:border-green disabled:opacity-60";
const inputCls =
  "w-full rounded-xl border border-line3 bg-white px-[14px] py-3 text-[16px] outline-none focus:border-green";

export default function IntakePage() {
  const [step, setStep] = useState<Step>("consent");
  const [declined, setDeclined] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [recording, setRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [camError, setCamError] = useState<string | null>(null);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);

  const [statements, setStatements] = useState<Statement[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [customText, setCustomText] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [chosenText, setChosenText] = useState("");

  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [qIndex, setQIndex] = useState(0);

  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [role, setRole] = useState("");

  const [flowError, setFlowError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const { data: session } = useSession();
  const track = useTrackEvent();

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function go(next: Step) {
    setFlowError(null);
    setStep(next);
    window.scrollTo(0, 0);
  }

  // ───────── Consent ─────────

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
    go("record");
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

  // ───────── Recording ─────────

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
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : "video/webm";
      const audioMimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";

      let videoResult: Blob | null = null;
      let audioResult: Blob | null = null;
      const trySubmit = () => {
        if (videoResult && audioResult) void submitRecording(videoResult, "intake-recording.webm", audioResult);
      };

      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        videoResult = new Blob(chunksRef.current, { type: mimeType });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        trySubmit();
      };
      recorderRef.current = recorder;

      // Whisper only needs audio and hard-caps uploads at 25MB — split off a lightweight
      // audio-only track to transcribe instead of sending the whole (much larger) video.
      const audioOnlyStream = new MediaStream(stream.getAudioTracks());
      const audioRecorder = new MediaRecorder(audioOnlyStream, { mimeType: audioMimeType });
      audioRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      audioRecorder.onstop = () => {
        audioResult = new Blob(audioChunksRef.current, { type: audioMimeType });
        trySubmit();
      };
      audioRecorderRef.current = audioRecorder;

      recorder.start();
      audioRecorder.start();
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
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    if (audioRecorderRef.current && audioRecorderRef.current.state !== "inactive") audioRecorderRef.current.stop();
  }

  function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void submitRecording(file, file.name);
  }

  async function submitRecording(blob: Blob, fileName: string, audioBlob?: Blob) {
    if (!sessionId) return;
    go("transcribing");
    setTranscribeError(null);
    try {
      const res = await uploadAndTranscribe(sessionId, blob, fileName, audioBlob);
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || "Transcription failed");
      if (!data) throw new Error("The server sent back an unexpected response — please try again.");
      setStatements(data.statements);
      track("recording_completed");
      go("statement");
    } catch (err) {
      setTranscribeError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  // ───────── Problem statement ─────────

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
        setPicked(null);
      }
    } finally {
      setRegenerating(false);
    }
  }

  async function confirmStatement() {
    if (!sessionId) return;
    const payload =
      editing && customText.trim()
        ? { action: "custom", text: customText.trim() }
        : picked
          ? { action: "select", statementId: picked }
          : null;
    if (!payload) return;
    const res = await fetch(`/api/intake/${sessionId}/statements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      setFlowError(data.error || "Could not save your choice");
      return;
    }
    setChosenText(data.text);
    track("statement_selected", { custom: payload.action === "custom" });
    await loadQuestions();
  }

  // ───────── Diagnostic questions ─────────

  async function diagnostic(body: object) {
    const res = await fetch(`/api/intake/${sessionId}/diagnostic`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await safeJson(res);
    if (!res.ok) throw Object.assign(new Error(data?.error || "Something went wrong"), { status: res.status });
    return data;
  }

  async function loadQuestions() {
    go("loadingQuestions");
    try {
      const data = await diagnostic({ action: "questions" });
      setQuestions(data.questions);
      setAnswers(data.questions.map(() => ""));
      setQIndex(0);
      track("diagnostic_started", { questions: data.questions.length });
      go("questions");
    } catch (err) {
      setFlowError(err instanceof Error ? err.message : "Could not load the questions");
      setStep("statement");
    }
  }

  async function nextQuestion() {
    if (qIndex < questions.length - 1) {
      setQIndex((i) => i + 1);
      window.scrollTo(0, 0);
      return;
    }
    try {
      await diagnostic({ action: "answers", answers });
      track("diagnostic_answered");
      go("details");
    } catch (err) {
      setFlowError(err instanceof Error ? err.message : "Could not save your answers");
    }
  }

  // ───────── Business details, account gate, results ─────────

  async function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    try {
      await diagnostic({ action: "context", context: { website, industry, department, role } });
      if (session?.user) await finish();
      else go("account");
    } catch (err) {
      setFlowError(err instanceof Error ? err.message : "Could not save your details");
    }
  }

  async function finish() {
    go("finishing");
    try {
      const data = await diagnostic({ action: "finalize" });
      track("diagnosis_completed");
      router.push(`/diagnosis/${data.id}`);
      router.refresh();
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 401) {
        go("account");
        return;
      }
      setFlowError(err instanceof Error ? err.message : "Could not finish your diagnosis");
      setStep("details");
    }
  }

  const canConfirm = picked !== null || (editing && customText.trim().length > 0);
  const isLastQuestion = qIndex === questions.length - 1;

  return (
    <section className="mx-auto max-w-[860px] px-6 pb-20 pt-12">
      <StepTracker current={TRACKER_INDEX[step]} />

      {flowError && (
        <div role="alert" className="mb-6 rounded-2xl border border-[#E8C3C3] bg-[#FDF2F2] p-4 text-[14.5px] font-semibold text-[#9B2C2C]">
          {flowError}
        </div>
      )}

      {step === "consent" && !declined && (
        <div>
          <div className="flex items-center gap-5">
            <img src="/assets/mascots/flame.png" alt="" className="h-[96px] w-auto" />
            <div>
              <h1 className="text-[36px] font-extrabold">Before you start</h1>
              <p className="mt-1 text-muted">About 8 minutes in total. Your first diagnostic is free.</p>
            </div>
          </div>
          <div className="mt-7 grid gap-[18px] rounded-[20px] border border-line bg-white p-7">
            <Notice title="How Inquew uses AI.">
              AI drafts your problem statements, writes the diagnostic questions and your summary. AI agents build the
              deliverables you buy, and a consultant checks every one before it reaches you.
            </Notice>
            <Notice title="What happens to your recordings.">
              Your video and any spoken answers become text transcripts. Recordings and transcripts are stored encrypted
              in your business library until you delete them. We never create face or voice biometric data.
            </Notice>
            <Notice title="Not used to train AI.">
              Inquew never trains AI on your data, and our AI providers&apos; API terms don&apos;t allow it either.
            </Notice>
          </div>
          <p className="mt-4 text-[14px] text-muted">
            By continuing you agree to the <a href="/privacy">privacy policy</a>.
          </p>
          <div className="mt-[22px] flex flex-wrap gap-[14px]">
            <button onClick={consent} className={btnPrimary}>
              Agree and continue
            </button>
            <button onClick={decline} className={btnSecondary}>
              Prefer not to use AI? Talk to us instead
            </button>
          </div>
        </div>
      )}

      {declined && (
        <div className="rounded-[22px] border border-line bg-white p-11 text-center">
          <h1 className="text-[34px] font-bold">The manual path it is</h1>
          <p className="mx-auto mt-4 max-w-[44ch] text-[17px] text-muted">
            Nothing will be recorded or transcribed. Send us a message and we&apos;ll take your problem down in a
            conversation instead. You can still buy from the same menu at the same prices.
          </p>
          <div className="mt-[30px] flex flex-wrap justify-center gap-[14px]">
            <Link href="/contact" className={btnPrimary}>
              Contact us
            </Link>
            <Link href="/deliverables" className={btnSecondary}>
              Browse the menu
            </Link>
            <button
              onClick={() => {
                setDeclined(false);
                setStep("consent");
              }}
              className={btnSecondary}
            >
              Back to the notice
            </button>
          </div>
        </div>
      )}

      {step === "record" && (
        <div>
          <h1 className="text-[36px] font-extrabold">Tell us what&apos;s not working</h1>
          <p className="mt-3 text-[17px] text-muted">
            About two minutes. Try to cover what&apos;s happening, who it affects, what it costs you, and what you&apos;ve
            already tried. Plain words are perfect.
          </p>
          <div className="mt-7 rounded-[22px] bg-forest p-[22px]">
            <div className="relative flex aspect-[16/10] flex-col items-center justify-center gap-[14px] overflow-hidden rounded-2xl bg-[#1E2B23]">
              <video ref={videoRef} muted playsInline className={`absolute inset-0 h-full w-full object-cover ${recording ? "block" : "hidden"}`} />
              {recording && (
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/45 px-3 py-[6px]">
                  <span className="animate-pulse-dot h-[9px] w-[9px] rounded-full bg-[#FF6B6B]" />
                  <span className="font-mono text-[13px] font-semibold text-white">
                    {String(Math.floor(recTime / 60))}:{String(recTime % 60).padStart(2, "0")} / 2:00
                  </span>
                </div>
              )}
              {!recording && (
                <p className="max-w-[32ch] text-center text-[15px] text-[#DCE8E0]">
                  Your camera preview appears here once you grant permission.
                </p>
              )}
            </div>
            {recording && (
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-sky" style={{ width: `${(recTime / RECORD_SECONDS_LIMIT) * 100}%` }} />
              </div>
            )}
            <div className="mt-[18px] flex flex-wrap items-center gap-3">
              {!recording && (
                <button onClick={startRec} className="min-h-[44px] rounded-full bg-sky px-6 py-[13px] font-semibold text-forest">
                  Start recording
                </button>
              )}
              {recording && (
                <button onClick={stopRec} className="min-h-[44px] rounded-full bg-white px-6 py-[13px] font-semibold text-forest">
                  Stop and use this video
                </button>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[44px] rounded-full border border-[#4F7A5E] px-5 py-[13px] text-[14.5px] font-semibold text-[#DCE8E0]"
              >
                Upload a video instead
              </button>
              <input ref={fileInputRef} type="file" accept="video/*,audio/*" className="hidden" onChange={onFileChosen} />
            </div>
            {camError && <p className="mt-3 text-[13.5px] text-[#FFB4B4]">{camError}</p>}
          </div>
          <div className="mt-5">
            <RecordingDisclaimer />
          </div>
        </div>
      )}

      {step === "transcribing" && (
        <div>
          {!transcribeError && <Thinking />}
          {transcribeError && (
            <div className="mx-auto mt-8 max-w-[480px] rounded-2xl border border-[#E8C3C3] bg-[#FDF2F2] p-5">
              <p className="text-[14.5px] font-semibold text-[#9B2C2C]">{transcribeError}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={() => go("record")} className={btnSecondary}>
                  Try recording again
                </button>
                <Link href="/contact" className={btnPrimary}>
                  Talk to us instead
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {step === "statement" && (
        <div>
          <div className="flex flex-wrap items-center gap-5">
            <img src="/assets/mascots/pen.png" alt="" className="h-[72px] w-auto" />
            <div className="min-w-0 flex-[1_1_400px]">
              <h1 className="text-[34px] font-extrabold">Which of these sounds most like your problem?</h1>
              <p className="mt-2 text-[16px] text-muted">
                Inquew drafted three versions from your video. Pick the closest one, write your own, or ask for three new
                ones.
              </p>
            </div>
          </div>
          <fieldset className="mt-7 grid gap-[14px]">
            <legend className="sr-only">Problem statements</legend>
            {statements.map((s, i) => {
              const on = picked === s.id;
              return (
                <label
                  key={s.id}
                  className="flex cursor-pointer items-start gap-4 rounded-[18px] bg-white p-6"
                  style={{
                    border: on ? "2px solid #2D7B5F" : "1px solid #C9D1CC",
                    boxShadow: on ? "0 0 0 4px #D6F6FB" : "none"
                  }}
                >
                  <input
                    type="radio"
                    name="statement"
                    checked={on}
                    onChange={() => {
                      setPicked(s.id);
                      setEditing(false);
                    }}
                    className="mt-1 h-[22px] w-[22px] flex-shrink-0 accent-green"
                  />
                  <span>
                    <span className="text-[12.5px] font-bold uppercase tracking-[0.06em] text-olive">Option {String.fromCharCode(65 + i)}</span>
                    <span className="mt-2 block font-display text-[19px] font-semibold leading-[1.4] text-forest">{s.text}</span>
                    {s.angle && <span className="mt-2 block text-[14px] text-muted">{s.angle}</span>}
                  </span>
                </label>
              );
            })}
          </fieldset>
          <div className="mt-[22px] flex flex-wrap gap-3">
            <button onClick={regenerate} disabled={regenerating} className={btnSecondary}>
              {regenerating ? "Drafting…" : "Draft three new ones"}
            </button>
            <button
              onClick={() => {
                setEditing((e) => !e);
                setPicked(null);
              }}
              className={btnSecondary}
            >
              Write my own instead
            </button>
            <button onClick={() => go("record")} className={btnSecondary}>
              None fit · re-record
            </button>
          </div>
          {editing && (
            <div className="mt-4">
              <label htmlFor="custom-statement" className="mb-2 block font-semibold">
                In your own words, the problem is…
              </label>
              <textarea
                id="custom-statement"
                rows={3}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className={inputCls}
              />
            </div>
          )}
          <div className="mt-[26px] flex flex-wrap items-center gap-4">
            <button onClick={confirmStatement} disabled={!canConfirm} className={btnPrimary}>
              Start the diagnostic
            </button>
            <span className="text-[14px] text-muted">Next: up to 7 questions, about 5 minutes.</span>
          </div>
        </div>
      )}

      {step === "loadingQuestions" && <Thinking lines={["Lining up the questions that matter most…", "Inquew is thinking through your problem…"]} />}

      {step === "questions" && questions.length > 0 && (
        <div className="grid gap-6">
          <details open className="rounded-2xl border border-line bg-white px-5 py-4">
            <summary className="cursor-pointer font-semibold text-forest">Your problem statement</summary>
            <p className="mt-2 text-[#36423B]">{chosenText}</p>
          </details>

          <div className="grid gap-2">
            <div className="flex justify-between text-[14px]">
              <span className="font-semibold text-forest">
                Question {qIndex + 1} of {questions.length}
                {isLastQuestion ? " · last one" : ""}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Diagnostic progress"
              aria-valuenow={qIndex + 1}
              aria-valuemin={0}
              aria-valuemax={questions.length}
              className="h-[10px] overflow-hidden rounded-full bg-line"
            >
              <div className="h-full rounded-full bg-sky" style={{ width: `${((qIndex + 1) / questions.length) * 100}%` }} />
            </div>
          </div>

          {isLastQuestion ? (
            <div className="flex flex-wrap items-center gap-7 rounded-3xl bg-forest p-8 text-white">
              <div className="flex h-[120px] w-[120px] flex-shrink-0 items-center justify-center rounded-full bg-white">
                <img src="/assets/mascots/flame.png" alt="" className="h-[90px] w-auto" />
              </div>
              <h1 className="min-w-0 flex-[1_1_340px] text-[28px] font-extrabold leading-[1.25] text-white">{questions[qIndex]}</h1>
            </div>
          ) : (
            <h1 className="text-[28px] font-extrabold leading-[1.3]">{questions[qIndex]}</h1>
          )}

          <div className="grid gap-2">
            <label htmlFor="answer" className="font-semibold">
              {isLastQuestion ? "Dream big. There are no wrong answers." : "Your answer"}
            </label>
            <textarea
              id="answer"
              rows={isLastQuestion ? 8 : 5}
              value={answers[qIndex] ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setAnswers((a) => a.map((x, i) => (i === qIndex ? v : x)));
              }}
              className={inputCls}
            />
          </div>

          {sessionId && (
            <AnswerRecorder
              key={qIndex}
              intakeId={sessionId}
              onText={(text) => setAnswers((a) => a.map((x, i) => (i === qIndex ? (x ? `${x} ${text}` : text) : x)))}
            />
          )}
          <RecordingDisclaimer />

          <div className="flex flex-wrap justify-between gap-3">
            <button
              onClick={() => (qIndex === 0 ? go("statement") : setQIndex((i) => i - 1))}
              className={btnSecondary}
            >
              Back
            </button>
            <div className="flex flex-wrap gap-3">
              {!isLastQuestion && !answers[qIndex]?.trim() && (
                <button onClick={nextQuestion} className={btnSecondary}>
                  Skip
                </button>
              )}
              <button onClick={nextQuestion} className={btnPrimary}>
                {isLastQuestion ? "Finish questions" : "Next question"}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "details" && (
        <form onSubmit={submitDetails} className="grid gap-6">
          <div className="flex items-center gap-5">
            <img src="/assets/mascots/city.png" alt="" className="h-[80px] w-auto" />
            <div>
              <h1 className="text-[32px] font-extrabold">A little about your business</h1>
              <p className="mt-1 text-muted">This helps Inquew fit the results to your industry and role.</p>
            </div>
          </div>
          <div className="grid gap-5 rounded-[20px] border border-line bg-white p-7">
            <Field id="website" label="Company website or LinkedIn (optional)">
              <input id="website" type="text" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourcompany.com" className={inputCls} />
            </Field>
            <Field id="industry" label="Industry">
              <select id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} className={inputCls}>
                {INDUSTRIES.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
              <Field id="department" label="Your department">
                <select id="department" value={department} onChange={(e) => setDepartment(e.target.value)} className={inputCls}>
                  {DEPARTMENTS.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              <Field id="role" label="Your role">
                <input id="role" type="text" required value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Owner, Operations manager" className={inputCls} />
              </Field>
            </div>
          </div>
          <div className="flex flex-wrap justify-between gap-3">
            <button type="button" onClick={() => go("questions")} className={btnSecondary}>
              Back
            </button>
            <button type="submit" className={btnPrimary}>
              See my diagnosis
            </button>
          </div>
        </form>
      )}

      {step === "account" && <AccountGate onDone={finish} />}

      {step === "finishing" && (
        <Thinking lines={["Inquew is diagnosing what's really going on…", "Writing up your results…", "Picking the best place to start…"]} />
      )}
    </section>
  );
}

/**
 * Results sit behind a free account. Signing up (or in) here keeps the flow on this page;
 * the diagnosis is attached to the account when it's finalized.
 */
function AccountGate({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, businessName })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not create your account");
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) throw new Error("Incorrect email or password");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-[720px]">
      <div aria-hidden="true" className="grid gap-5 opacity-60 blur-[7px]">
        <div className="h-[150px] rounded-3xl bg-forest" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-[180px] rounded-2xl border-2 border-green bg-white" />
          <div className="h-[180px] rounded-2xl bg-white" />
          <div className="h-[180px] rounded-2xl bg-white" />
        </div>
      </div>
      <div className="absolute inset-0 flex items-start justify-center pt-4">
        <form onSubmit={submit} className="grid w-full max-w-[480px] gap-4 rounded-3xl bg-white p-8 shadow-[0_20px_60px_rgba(20,64,26,.18)]">
          <div className="flex items-center gap-4">
            <img src="/assets/mascots/document.png" alt="" className="h-[56px] w-auto" />
            <h1 className="text-[23px] font-extrabold leading-[1.25]">
              Your diagnosis is ready. {mode === "signup" ? "Create a free account to see it." : "Sign in to see it."}
            </h1>
          </div>
          <p className="text-[15px] text-muted">
            An account keeps your results safe in your business library, and lets you order deliverables and keep
            diagnosing.
          </p>
          {mode === "signup" && (
            <>
              <Field id="gate-name" label="Your name">
                <input id="gate-name" required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
              </Field>
              <Field id="gate-company" label="Company name">
                <input id="gate-company" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputCls} />
              </Field>
            </>
          )}
          <Field id="gate-email" label="Work email">
            <input id="gate-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </Field>
          <Field id="gate-password" label={mode === "signup" ? "Password (at least 8 characters)" : "Password"}>
            <input
              id="gate-password"
              type="password"
              required
              minLength={mode === "signup" ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </Field>
          {error && <p className="text-[13.5px] font-semibold text-[#9B2C2C]">{error}</p>}
          <button type="submit" disabled={busy} className={btnPrimary}>
            {busy ? "One moment…" : mode === "signup" ? "Create free account and see results" : "Sign in and see results"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signup" ? "signin" : "signup");
              setError(null);
            }}
            className="text-[14px] font-semibold text-green underline"
          >
            {mode === "signup" ? "Already have an account? Sign in" : "New here? Create a free account"}
          </button>
          <div className="flex items-start gap-3 border-t border-line pt-4 text-[13px] text-muted">
            <LockIcon className="h-[18px] w-[18px] flex-shrink-0" />
            <span>Encrypted, and visible only to you and the Inquew team working on your request.</span>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-[6px]">
      <label htmlFor={id} className="text-[14px] font-semibold text-[#36423B]">
        {label}
      </label>
      {children}
    </div>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-[14px]">
      <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green" />
      <div>
        <strong className="font-semibold text-forest">{title}</strong> <span className="text-muted">{children}</span>
      </div>
    </div>
  );
}
