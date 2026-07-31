import { useState } from "react";
import { apiFetch, ApiError } from "@/api/client";
import { Scene } from "@/api/types";

export function ScenesPanel({
  scriptId,
  scenes,
  onChanged,
}: {
  scriptId: string;
  scenes: Scene[];
  onChanged: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [visualLoading, setVisualLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>, setFlag: (v: boolean) => void) {
    setError(null);
    setFlag(true);
    try {
      await action();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
    } finally {
      setFlag(false);
    }
  }

  return (
    <section className="panel p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold">2. Sahnalar</h2>
        <div className="flex gap-2">
          {scenes.length > 0 && (
            <>
              <button
                onClick={() =>
                  run(
                    () => apiFetch(`/scripts/${scriptId}/voice-all`, { method: "POST" }),
                    setVoiceLoading
                  )
                }
                disabled={voiceLoading}
                className="btn-secondary text-xs"
              >
                {voiceLoading ? "Ovoz yaratilmoqda..." : "Barcha ovoz"}
              </button>
              <button
                onClick={() =>
                  run(
                    () => apiFetch(`/scripts/${scriptId}/visual-all`, { method: "POST" }),
                    setVisualLoading
                  )
                }
                disabled={visualLoading}
                className="btn-secondary text-xs"
              >
                {visualLoading ? "Rasm yaratilmoqda..." : "Barcha vizual"}
              </button>
            </>
          )}
          <button
            onClick={() =>
              run(() => apiFetch(`/scripts/${scriptId}/scenes`, { method: "POST" }), setLoading)
            }
            disabled={loading}
            className="btn-primary text-xs"
          >
            {loading ? "..." : scenes.length > 0 ? "Qayta bo'lish" : "Sahnalarga bo'lish"}
          </button>
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-signal-red">{error}</p>}

      {scenes.length === 0 ? (
        <p className="text-sm text-studio-muted">Hali sahnalar yaratilmagan.</p>
      ) : (
        <div className="space-y-2">
          {scenes.map((scene) => (
            <div
              key={scene.id}
              className="flex items-start gap-3 rounded-md border border-studio-border bg-studio-panelRaised p-3"
            >
              <span className="label-mono mt-0.5 shrink-0">#{scene.order}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{scene.narration}</p>
                <div className="mt-1.5 flex gap-3">
                  <span className={`label-mono ${scene.audioFileUrl ? "text-signal-teal" : ""}`}>
                    {scene.audioFileUrl ? "✓ ovoz" : "ovoz yo'q"}
                  </span>
                  <span className={`label-mono ${scene.visualFileUrl ? "text-signal-teal" : ""}`}>
                    {scene.visualFileUrl ? "✓ vizual" : "vizual yo'q"}
                  </span>
                  <span className="label-mono">{scene.durationSec}s</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
