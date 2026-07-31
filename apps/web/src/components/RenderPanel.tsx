import { useEffect, useRef, useState } from "react";
import { apiFetch, ApiError } from "@/api/client";
import { RenderJob, Scene } from "@/api/types";

export function RenderPanel({
  scriptId,
  scenes,
  renderJob,
  onJobCreated,
  onJobUpdate,
}: {
  scriptId: string;
  scenes: Scene[];
  renderJob: RenderJob | null;
  onJobCreated: (job: RenderJob) => void;
  onJobUpdate: (job: RenderJob) => void;
}) {
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const allReady = scenes.length > 0 && scenes.every((s) => s.audioFileUrl && s.visualFileUrl);

  useEffect(() => {
    if (renderJob && (renderJob.status === "QUEUED" || renderJob.status === "PROCESSING")) {
      pollRef.current = setInterval(async () => {
        const updated = await apiFetch<RenderJob>(`/scripts/render-jobs/${renderJob.id}`);
        onJobUpdate(updated);
        if (updated.status === "DONE" || updated.status === "FAILED") {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      }, 3000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderJob?.id, renderJob?.status]);

  async function startRender() {
    setError(null);
    setStarting(true);
    try {
      const job = await apiFetch<RenderJob>(`/scripts/${scriptId}/render`, { method: "POST" });
      onJobCreated(job);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
    } finally {
      setStarting(false);
    }
  }

  return (
    <section className="panel p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold">3. Video render</h2>
        <button
          onClick={startRender}
          disabled={!allReady || starting || renderJob?.status === "PROCESSING"}
          className="btn-primary text-xs"
        >
          {starting ? "Boshlanmoqda..." : "Render qilish"}
        </button>
      </div>

      {!allReady && (
        <p className="text-sm text-studio-muted">
          Render qilish uchun barcha sahnalarda ovoz va vizual tayyor bo'lishi kerak.
        </p>
      )}

      {error && <p className="text-sm text-signal-red">{error}</p>}

      {renderJob && (
        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="label-mono">{renderJob.status}</span>
            <span className="label-mono">{renderJob.progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-studio-border">
            <div
              className="h-full bg-signal-amber transition-all duration-500"
              style={{ width: `${renderJob.progress}%` }}
            />
          </div>

          {renderJob.status === "DONE" && renderJob.outputFileUrl && (
            <video
              src={renderJob.outputFileUrl}
              controls
              className="mt-4 max-h-96 rounded-md border border-studio-border"
            />
          )}

          {renderJob.status === "FAILED" && (
            <p className="mt-2 text-sm text-signal-red">{renderJob.errorLog}</p>
          )}
        </div>
      )}
    </section>
  );
}
