import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { StatusBadge } from "@/components/StatusBadge";
import { apiFetch, ApiError } from "@/api/client";
import { NICHE_LABELS, Niche, Project } from "@/api/types";

const STATUS_VARIANT: Record<string, "amber" | "teal" | "red" | "muted"> = {
  DRAFT: "muted",
  SCRIPT_READY: "amber",
  SCENES_READY: "amber",
  VOICE_READY: "amber",
  RENDERING: "amber",
  DONE: "teal",
  FAILED: "red",
};

export function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function loadProjects() {
    setLoading(true);
    try {
      const data = await apiFetch<Project[]>("/projects");
      setProjects(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold">Loyihalar</h1>
          <p className="mt-1 text-sm text-studio-muted">Barcha video-loyihalaringiz</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
          {showForm ? "Bekor qilish" : "+ Yangi loyiha"}
        </button>
      </div>

      {showForm && (
        <CreateProjectForm
          onCreated={() => {
            setShowForm(false);
            loadProjects();
          }}
        />
      )}

      {loading ? (
        <p className="text-sm text-studio-muted">Yuklanmoqda...</p>
      ) : projects.length === 0 ? (
        <div className="panel p-10 text-center">
          <p className="text-studio-muted">Hali loyiha yo'q. Birinchisini yarating.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/projects/${p.id}`}
              className="panel flex items-center justify-between p-4 transition hover:border-signal-amber/40"
            >
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="label-mono mt-1">
                  {NICHE_LABELS[p.niche]} · {p.language.toUpperCase()}
                </p>
              </div>
              <StatusBadge status={p.status} variant={STATUS_VARIANT[p.status]} />
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}

function CreateProjectForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [niche, setNiche] = useState<Niche>("EDUCATIONAL");
  const [language, setLanguage] = useState("uz");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch("/projects", {
        method: "POST",
        body: JSON.stringify({ title, niche, language }),
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel mb-6 space-y-4 p-5">
      <div>
        <label className="label-mono mb-1.5 block">Sarlavha</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-field"
          placeholder="Masalan: O'rta asr Buyuk Ipak yo'li"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-mono mb-1.5 block">Yo'nalish</label>
          <select
            value={niche}
            onChange={(e) => setNiche(e.target.value as Niche)}
            className="input-field"
          >
            {Object.entries(NICHE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-mono mb-1.5 block">Til</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="input-field"
          >
            <option value="uz">O'zbek</option>
            <option value="tg">Tojik</option>
            <option value="ru">Rus</option>
            <option value="en">Ingliz</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-signal-red">{error}</p>}

      <button type="submit" disabled={submitting} className="btn-primary">
        {submitting ? "Yaratilmoqda..." : "Loyihani yaratish"}
      </button>
    </form>
  );
}
