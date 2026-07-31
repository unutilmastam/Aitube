import { useState } from "react";
import { apiFetch, ApiError } from "@/api/client";
import { SeoMeta } from "@/api/types";

export function SeoPanel({
  projectId,
  seo,
  hasScript,
  onChanged,
}: {
  projectId: string;
  seo: SeoMeta | null;
  hasScript: boolean;
  onChanged: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setError(null);
    setLoading(true);
    try {
      await apiFetch(`/projects/${projectId}/seo`, { method: "POST" });
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold">5. SEO</h2>
        <button onClick={generate} disabled={!hasScript || loading} className="btn-primary text-xs">
          {loading ? "Yaratilmoqda..." : seo ? "Qayta yaratish" : "SEO yaratish"}
        </button>
      </div>

      {error && <p className="mb-2 text-sm text-signal-red">{error}</p>}

      {!seo ? (
        <p className="text-sm text-studio-muted">Hali SEO ma'lumotlari yaratilmagan.</p>
      ) : (
        <div className="space-y-3 text-sm">
          <div>
            <span className="label-mono">Sarlavha</span>
            <p className="mt-1">{seo.title}</p>
          </div>
          <div>
            <span className="label-mono">Tavsif</span>
            <p className="mt-1 whitespace-pre-line text-studio-muted">{seo.description}</p>
          </div>
          <div>
            <span className="label-mono">Teglar</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {seo.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-studio-border px-2 py-0.5 text-xs text-studio-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          {seo.chapters && seo.chapters.length > 0 && (
            <div>
              <span className="label-mono">Chapters</span>
              <div className="mt-1.5 space-y-0.5 font-mono text-xs text-studio-muted">
                {seo.chapters.map((c, i) => (
                  <p key={i}>
                    {c.time} — {c.label}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
