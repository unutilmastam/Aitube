import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, ApiError } from "@/api/client";
import { UploadJob, YoutubeChannel } from "@/api/types";

export function UploadPanel({
  projectId,
  renderDone,
  hasSeo,
}: {
  projectId: string;
  renderDone: boolean;
  hasSeo: boolean;
}) {
  const [channels, setChannels] = useState<YoutubeChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState("");
  const [visibility, setVisibility] = useState<"PRIVATE" | "UNLISTED" | "PUBLIC">("PRIVATE");
  const [scheduledAt, setScheduledAt] = useState("");
  const [job, setJob] = useState<UploadJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<YoutubeChannel[]>("/youtube/channels").then((data) => {
      setChannels(data);
      if (data[0]) setSelectedChannel(data[0].id);
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const newJob = await apiFetch<UploadJob>("/youtube/upload", {
        method: "POST",
        body: JSON.stringify({
          projectId,
          youtubeAccountId: selectedChannel,
          visibility,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        }),
      });
      setJob(newJob);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  const canUpload = renderDone && hasSeo && channels.length > 0;

  return (
    <section className="panel p-5">
      <h2 className="mb-3 font-display text-sm font-semibold">6. YouTube'ga yuklash</h2>

      {channels.length === 0 ? (
        <p className="text-sm text-studio-muted">
          Hech qanday kanal ulanmagan.{" "}
          <Link to="/youtube" className="text-signal-amber underline">
            Kanal ulash
          </Link>
        </p>
      ) : !renderDone ? (
        <p className="text-sm text-studio-muted">Avval video render tugashi kerak.</p>
      ) : !hasSeo ? (
        <p className="text-sm text-studio-muted">Avval SEO ma'lumotlarini yarating.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-mono mb-1.5 block">Kanal</label>
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="input-field"
              >
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.channelTitle}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-mono mb-1.5 block">Ko'rinish</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as typeof visibility)}
                className="input-field"
              >
                <option value="PRIVATE">Shaxsiy</option>
                <option value="UNLISTED">Ro'yxatsiz</option>
                <option value="PUBLIC">Ommaviy</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label-mono mb-1.5 block">Rejalashtirish (ixtiyoriy)</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="input-field"
            />
          </div>

          {error && <p className="text-sm text-signal-red">{error}</p>}

          <button type="submit" disabled={!canUpload || loading} className="btn-primary">
            {loading ? "Yuborilmoqda..." : scheduledAt ? "Rejalashtirish" : "Darhol yuklash"}
          </button>
        </form>
      )}

      {job && (
        <div className="mt-4 rounded-md border border-studio-border bg-studio-panelRaised p-3 text-sm">
          <p className="label-mono mb-1">{job.status}</p>
          {job.youtubeVideoId && (
            <a
              href={`https://youtube.com/watch?v=${job.youtubeVideoId}`}
              target="_blank"
              rel="noreferrer"
              className="text-signal-amber underline"
            >
              Videoni ko'rish →
            </a>
          )}
          {job.errorLog && <p className="text-signal-red">{job.errorLog}</p>}
        </div>
      )}
    </section>
  );
}
