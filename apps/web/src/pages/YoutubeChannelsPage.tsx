import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { apiFetch } from "@/api/client";
import { YoutubeChannel } from "@/api/types";

export function YoutubeChannelsPage() {
  const [channels, setChannels] = useState<YoutubeChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  async function load() {
    setLoading(true);
    const data = await apiFetch<YoutubeChannel[]>("/youtube/channels");
    setChannels(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function connect() {
    setConnecting(true);
    const { url } = await apiFetch<{ url: string }>("/youtube/connect");
    window.open(url, "_blank", "noopener,noreferrer");
    setConnecting(false);
  }

  async function disconnect(id: string) {
    await apiFetch(`/youtube/channels/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold">YouTube kanallar</h1>
          <p className="mt-1 text-sm text-studio-muted">
            Video yuklash uchun kanal(lar)ingizni ulang
          </p>
        </div>
        <button onClick={connect} disabled={connecting} className="btn-primary">
          {connecting ? "..." : "+ Kanal ulash"}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-studio-muted">Yuklanmoqda...</p>
      ) : channels.length === 0 ? (
        <div className="panel p-10 text-center">
          <p className="text-studio-muted">
            Hech qanday kanal ulanmagan. Yuqoridagi tugma orqali Google akkauntingizni ulang.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {channels.map((c) => (
            <div key={c.id} className="panel flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{c.channelTitle}</p>
                <p className="label-mono mt-1">{c.channelId}</p>
              </div>
              <button
                onClick={() => disconnect(c.id)}
                className="text-sm text-signal-red underline decoration-dotted"
              >
                Uzish
              </button>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
