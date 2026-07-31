import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/api/client";

export function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            aitube<span className="text-signal-amber">.</span>
          </h1>
          <p className="label-mono mt-1">production console</p>
        </div>

        <div className="panel p-6">
          <div className="mb-6 flex rounded-md border border-studio-border p-1">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 rounded px-3 py-1.5 text-sm transition ${
                mode === "login" ? "bg-signal-amber text-studio-bg" : "text-studio-muted"
              }`}
            >
              Kirish
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 rounded px-3 py-1.5 text-sm transition ${
                mode === "register" ? "bg-signal-amber text-studio-bg" : "text-studio-muted"
              }`}
            >
              Ro'yxatdan o'tish
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-mono mb-1.5 block">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="siz@misol.uz"
              />
            </div>
            <div>
              <label className="label-mono mb-1.5 block">Parol</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
              />
              {mode === "register" && (
                <p className="mt-1.5 text-xs text-studio-muted">
                  Kamida 8 belgi, 1 katta harf, 1 raqam
                </p>
              )}
            </div>

            {error && (
              <p className="rounded-md border border-signal-red/30 bg-signal-red/10 px-3 py-2 text-sm text-signal-red">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Yuklanmoqda..." : mode === "login" ? "Kirish" : "Ro'yxatdan o'tish"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
