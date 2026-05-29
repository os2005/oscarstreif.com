"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { processPendingInboxAction, submitInboxItemAction } from "./server/actions";
import type { InboxItemSummary, InboxSnapshot } from "./server/wiki-store";

type LlmWikiIngestWorkspaceProps = {
  inbox: InboxSnapshot;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 102.4) / 10} KB`;
  return `${Math.round(value / 1024 / 102.4) / 10} MB`;
}

function statusLabel(item: InboxItemSummary) {
  if (item.status === "manual-review") return "manual review";
  return item.status;
}

function InboxItemRow({ item }: { item: InboxItemSummary }) {
  const statusStyle =
    item.status === "processed"
      ? "border-emerald-300/24 text-emerald-100"
      : item.status === "failed" || item.status === "manual-review"
        ? "border-amber-300/28 text-amber-100"
        : item.status === "processing"
          ? "border-sky-300/28 text-sky-100"
          : "border-paper/12 text-paper/56";

  return (
    <article className="border border-paper/10 bg-black/18 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium text-paper">{item.title}</p>
            <span className={cx("border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em]", statusStyle)}>
              {statusLabel(item)}
            </span>
            <span className="border border-paper/10 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-paper/40">
              {item.kind}
            </span>
          </div>
          <p className="mt-2 break-all font-mono text-[10px] text-paper/36">{item.sourcePath}</p>
          {item.error ? <p className="mt-2 text-xs leading-5 text-amber-100/82">{item.error}</p> : null}
        </div>
        <div className="shrink-0 text-left md:text-right">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper/38">{formatBytes(item.size)}</p>
          <p className="mt-1 text-xs text-paper/46">{formatDate(item.createdAt)}</p>
        </div>
      </div>
    </article>
  );
}

function VoiceCapture() {
  const chunksRef = useRef<Blob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [recording, setRecording] = useState<{
    blob: Blob;
    durationSeconds: number;
    title: string;
    url: string;
  } | null>(null);
  const isRecording = recorder?.state === "recording";

  async function startRecording() {
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Audio recording is not available in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const nextRecorder = new MediaRecorder(stream);
      const startTime = Date.now();
      chunksRef.current = [];

      nextRecorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      });

      nextRecorder.addEventListener("stop", () => {
        const blob = new Blob(chunksRef.current, { type: nextRecorder.mimeType || "audio/webm" });
        const durationSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));
        const created = new Date();
        const title = `Voice Capture ${created.toLocaleString("de-DE", {
          dateStyle: "short",
          timeStyle: "short",
        })}`;

        stream.getTracks().forEach((track) => track.stop());
        setRecording({
          blob,
          durationSeconds,
          title,
          url: URL.createObjectURL(blob),
        });
        setRecorder(null);
      });

      nextRecorder.start();
      setRecorder(nextRecorder);
    } catch {
      setError("Microphone access was denied or failed.");
    }
  }

  function stopRecording() {
    if (recorder?.state === "recording") {
      recorder.stop();
    }
  }

  function discardRecording() {
    if (recording?.url) {
      URL.revokeObjectURL(recording.url);
    }

    setRecording(null);
    setError(null);
  }

  function uploadRecording() {
    if (!recording) return;

    const created = new Date();
    const stamp = created.toISOString().replace(/[:.]/g, "-");
    const formData = new FormData();
    const file = new File([recording.blob], `voice-${stamp}.webm`, {
      type: recording.blob.type || "audio/webm",
    });

    formData.set("kind", "voice");
    formData.set("title", recording.title);
    formData.set("sourceFile", file);

    startTransition(() => {
      void submitInboxItemAction(formData);
    });
  }

  return (
    <div className="space-y-3">
      <button
        className={cx(
          "h-12 w-full border px-4 font-mono text-[11px] uppercase tracking-[0.18em] transition",
          isRecording
            ? "border-red-300/40 bg-red-400/12 text-red-50"
            : "border-sky-300/30 bg-sky-300/10 text-sky-50 hover:bg-sky-300/16"
        )}
        onClick={isRecording ? stopRecording : startRecording}
        type="button"
      >
        {isRecording ? "Stop" : "Voice"}
      </button>
      {recording ? (
        <div className="border border-paper/10 bg-black/24 p-3">
          <audio className="w-full" controls src={recording.url} />
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-paper/42">
            {recording.durationSeconds}s ready
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              className="border border-paper/12 px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-paper/56 hover:bg-white/6"
              onClick={discardRecording}
              type="button"
            >
              Clear
            </button>
            <button
              className="border border-emerald-300/30 bg-emerald-300/10 px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-50 transition hover:bg-emerald-300/16 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isPending}
              onClick={uploadRecording}
              type="button"
            >
              {isPending ? "Saving" : "Save"}
            </button>
          </div>
        </div>
      ) : null}
      {error ? <p className="text-xs leading-5 text-red-100">{error}</p> : null}
    </div>
  );
}

export function LlmWikiIngestWorkspace({ inbox }: LlmWikiIngestWorkspaceProps) {
  const [filename, setFilename] = useState<string | null>(null);

  return (
    <section className="mx-auto flex min-h-[calc(100dvh-76px)] w-full max-w-6xl flex-col px-4 pb-12 pt-6 md:px-8">
      <div className="mb-5 flex flex-col gap-4 border border-paper/10 bg-white/[0.045] p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-paper/42">LLM Wiki</p>
          <h1 className="mt-2 font-display text-4xl leading-none text-paper md:text-5xl">Ingest</h1>
        </div>
        <div className="flex border border-paper/12 bg-black/24 p-1">
          <Link className="bg-paper px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink" href="/private/llm-wiki">
            Ingest
          </Link>
          <Link
            className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-paper/62 transition hover:bg-white/6 hover:text-paper"
            href="/private/llm-wiki?view=wiki"
          >
            View Wiki
          </Link>
        </div>
      </div>

      <div className="grid flex-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <main className="flex min-h-[420px] flex-col border border-paper/10 bg-white/[0.045]">
          <form action={submitInboxItemAction} className="flex flex-1 flex-col p-4 md:p-5" encType="multipart/form-data">
            <input name="kind" type="hidden" value="file" />
            <input
              className="mb-3 w-full border border-paper/12 bg-black/30 px-4 py-3 text-base text-paper outline-none focus:border-paper/36"
              name="title"
              placeholder="Optional title"
              type="text"
            />
            <textarea
              className="min-h-[260px] flex-1 resize-none border border-paper/12 bg-black/30 px-4 py-4 text-base leading-7 text-paper outline-none focus:border-paper/36"
              name="text"
              placeholder="Drop thoughts, tasks, notes, meeting fragments, questions..."
            />
            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-stretch">
              <label className="flex min-h-12 cursor-pointer items-center border border-paper/12 bg-black/24 px-4 font-mono text-[11px] uppercase tracking-[0.16em] text-paper/58 transition hover:bg-white/6">
                <input
                  className="sr-only"
                  name="sourceFile"
                  onChange={(event) => setFilename(event.target.files?.[0]?.name ?? null)}
                  type="file"
                />
                {filename ? filename : "Upload File"}
              </label>
              <VoiceCapture />
              <button
                className="h-12 border border-paper/16 bg-paper px-6 font-mono text-[11px] uppercase tracking-[0.18em] text-ink transition hover:bg-white"
                type="submit"
              >
                Submit
              </button>
            </div>
          </form>
        </main>

        <aside className="space-y-4">
          <section className="border border-paper/10 bg-black/20 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/38">Manager</p>
            <p className="mt-3 text-sm leading-6 text-paper/68">
              {inbox.hasApiKey
                ? `Ready with ${inbox.model}.`
                : "OPENAI_API_KEY is not configured. Processing will mark items for manual review."}
            </p>
            <form action={processPendingInboxAction} className="mt-4">
              <button
                className="w-full border border-amber-300/30 bg-amber-300/10 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-amber-50 transition hover:bg-amber-300/16"
                type="submit"
              >
                Process Pending Inbox
              </button>
            </form>
          </section>

          <section className="grid grid-cols-2 gap-2">
            <div className="border border-paper/10 bg-black/20 p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper/34">Pending</p>
              <p className="mt-1 text-2xl text-paper">{inbox.pendingCount}</p>
            </div>
            <div className="border border-paper/10 bg-black/20 p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper/34">Processed</p>
              <p className="mt-1 text-2xl text-paper">{inbox.processedCount}</p>
            </div>
          </section>
        </aside>
      </div>

      <section className="mt-5 border border-paper/10 bg-white/[0.035]">
        <div className="border-b border-paper/10 bg-black/18 px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/38">Inbox Queue</p>
        </div>
        <div className="space-y-3 p-3">
          {inbox.items.length ? (
            inbox.items.slice(0, 20).map((item) => <InboxItemRow item={item} key={item.id} />)
          ) : (
            <p className="px-2 py-8 text-center text-sm text-paper/52">No inbox items yet.</p>
          )}
        </div>
      </section>
    </section>
  );
}
