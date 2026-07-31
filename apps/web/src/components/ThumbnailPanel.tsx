import { useState } from "react";
import { apiFetch, ApiError } from "@/api/client";
import { Thumbnail } from "@/api/types";

export function ThumbnailPanel({
  projectId,
  thumbnails,
  hasScript,
  onChanged,
}: {
  projectId: string;
  thumbnails: Thumbnail[];
  hasScript: boolean;
  onChanged: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setError(null);
    setLoading(true);
    try {
      await apiFetch(`/projects/${projectId}/thumbnails`, { method: "POST" });
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  async function select(thumbnailId: string) {
    await apiFetch(`/projects/thumbnails/${thumbnailId}/select`, { method: "PATCH" });
    onChanged();
  }

  return (
    <section className="panel p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold">4. Thumbnail</h2>
        <button onClick={generate} disabled={!hasScript || loading} className="btn-primary text-xs">
          {loading ? "Yaratilmoqda..." : "3 variant yaratish"}
        </button>
      </div>

      {error && <p className="mb-2 text-sm text-signal-red">{error}</p>}

      {thumbnails.length === 0 ? (
        <p className="text-sm text-studio-muted">Hali thumbnail yaratilmagan.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {thumbnails.map((t) => (
            <button
              key={t.id}
              onClick={() => select(t.id)}
              className={`relative overflow-hidden rounded-md border-2 transition ${
                t.isSelected ? "border-signal-amber" : "border-studio-border hover:border-studio-muted"
              }`}
            >
              <img src={t.imageUrl} alt={t.headline || "thumbnail"} className="aspect-video w-full object-cover" />
              {t.isSelected && (
                <span className="absolute right-1.5 top-1.5 rounded-full bg-signal-amber px-2 py-0.5 font-mono text-[10px] text-studio-bg">
                  tanlangan
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
