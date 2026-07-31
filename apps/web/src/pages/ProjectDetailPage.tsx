import { FormEvent, useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { PipelineRail, PipelineStage, StageState } from "@/components/PipelineRail";
import { apiFetch, ApiError } from "@/api/client";
import { Project, Script, Scene, RenderJob, Thumbnail, SeoMeta } from "@/api/types";
import { ScenesPanel } from "@/components/ScenesPanel";
import { RenderPanel } from "@/components/RenderPanel";
import { ThumbnailPanel } from "@/components/ThumbnailPanel";
import { SeoPanel } from "@/components/SeoPanel";
import { UploadPanel } from "@/components/UploadPanel";

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [renderJob, setRenderJob] = useState<RenderJob | null>(null);
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
  const [seo, setSeo] = useState<SeoMeta | null>(null);
  const [loading, setLoading] = useState(true);

  const latestScript: Script | undefined = project?.scripts?.[0];

  const loadProject = useCallback(async () => {
    if (!id) return;
    const data = await apiFetch<Project>(`/projects/${id}`);
    setProject(data);
    return data;
  }, [id]);

  const loadScenes = useCallback(
    async (scriptId: string) => {
      const data = await apiFetch<Scene[]>(`/scripts/${scriptId}/scenes`);
      setScenes(data);
    },
    []
  );

  const loadThumbnails = useCallback(async () => {
    if (!id) return;
    const data = await apiFetch<Thumbnail[]>(`/projects/${id}/thumbnails`);
    setThumbnails(data);
  }, [id]);

  const loadSeo = useCallback(async () => {
    if (!id) return;
    try {
      const data = await apiFetch<SeoMeta>(`/projects/${id}/seo`);
      setSeo(data);
    } catch {
      setSeo(null);
    }
  }, [id]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await loadProject();
      if (data?.scripts?.[0]) {
        await loadScenes(data.scripts[0].id);
      }
      await loadThumbnails();
      await loadSeo();
      setLoading(false);
    })();
  }, [loadProject, loadScenes, loadThumbnails, loadSeo]);

  if (loading || !project) {
    return (
      <Layout>
        <p className="text-sm text-studio-muted">Yuklanmoqda...</p>
      </Layout>
    );
  }

  const stages = buildStages(project, scenes, renderJob, thumbnails, seo);

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold">{project.title}</h1>
        <p className="label-mono mt-1">
          {project.niche} · {project.language.toUpperCase()} · {project.status}
        </p>
      </div>

      <div className="mb-8">
        <PipelineRail stages={stages} />
      </div>

      <div className="space-y-6">
        <ScriptPanel
          project={project}
          script={latestScript}
          onGenerated={async (script) => {
            await loadProject();
            await loadScenes(script.id);
          }}
        />

        {latestScript && (
          <ScenesPanel
            scriptId={latestScript.id}
            scenes={scenes}
            onChanged={() => loadScenes(latestScript.id)}
          />
        )}

        {latestScript && scenes.length > 0 && (
          <RenderPanel
            scriptId={latestScript.id}
            scenes={scenes}
            renderJob={renderJob}
            onJobCreated={setRenderJob}
            onJobUpdate={setRenderJob}
          />
        )}

        <ThumbnailPanel
          projectId={project.id}
          thumbnails={thumbnails}
          hasScript={!!latestScript}
          onChanged={loadThumbnails}
        />

        <SeoPanel
          projectId={project.id}
          seo={seo}
          hasScript={!!latestScript}
          onChanged={loadSeo}
        />

        <UploadPanel
          projectId={project.id}
          renderDone={renderJob?.status === "DONE"}
          hasSeo={!!seo}
        />
      </div>
    </Layout>
  );
}

function buildStages(
  project: Project,
  scenes: Scene[],
  renderJob: RenderJob | null,
  thumbnails: Thumbnail[],
  seo: SeoMeta | null
): PipelineStage[] {
  const hasScript = !!project.scripts?.[0];
  const hasScenes = scenes.length > 0;
  const voiceDone = hasScenes && scenes.every((s) => s.audioFileUrl);
  const visualDone = hasScenes && scenes.every((s) => s.visualFileUrl);

  const stateOf = (done: boolean, active: boolean): StageState =>
    done ? "done" : active ? "active" : "pending";

  return [
    { key: "script", label: "Skript", state: stateOf(hasScript, !hasScript) },
    { key: "scenes", label: "Sahnalar", state: stateOf(hasScenes, hasScript && !hasScenes) },
    { key: "voice", label: "Ovoz", state: stateOf(voiceDone, hasScenes && !voiceDone) },
    { key: "visual", label: "Vizual", state: stateOf(visualDone, hasScenes && !visualDone) },
    {
      key: "render",
      label: "Render",
      state:
        renderJob?.status === "DONE"
          ? "done"
          : renderJob?.status === "FAILED"
          ? "failed"
          : renderJob
          ? "active"
          : "pending",
    },
    { key: "thumbnail", label: "Thumbnail", state: stateOf(thumbnails.length > 0, false) },
    { key: "seo", label: "SEO", state: stateOf(!!seo, false) },
    { key: "upload", label: "Upload", state: "pending" as StageState },
  ];
}

function ScriptPanel({
  project,
  script,
  onGenerated,
}: {
  project: Project;
  script?: Script;
  onGenerated: (script: Script) => void;
}) {
  const [topic, setTopic] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(!script);

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const newScript = await apiFetch<Script>(`/projects/${project.id}/script`, {
        method: "POST",
        body: JSON.stringify({ topic }),
      });
      onGenerated(newScript);
      setExpanded(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold">1. Skript</h2>
        {script && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="label-mono text-signal-amber"
          >
            {expanded ? "Yopish" : "Qayta generatsiya"}
          </button>
        )}
      </div>

      {script && !expanded && (
        <p className="whitespace-pre-line text-sm text-studio-muted">
          {script.content.slice(0, 300)}
          {script.content.length > 300 && "..."}
        </p>
      )}

      {expanded && (
        <form onSubmit={handleGenerate} className="space-y-3">
          <input
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="input-field"
            placeholder="Video mavzusi (masalan: Buyuk Ipak yo'li tarixi)"
          />
          {error && <p className="text-sm text-signal-red">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Generatsiya qilinmoqda..." : "Skript yaratish"}
          </button>
        </form>
      )}
    </section>
  );
}
