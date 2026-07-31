import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-studio-border bg-studio-panel">
        <div className="border-b border-studio-border px-5 py-5">
          <Link to="/" className="font-display text-lg font-semibold tracking-tight">
            aitube<span className="text-signal-amber">.</span>
          </Link>
          <p className="label-mono mt-1">production console</p>
        </div>

        <nav className="flex-1 px-3 py-4">
          <Link
            to="/"
            className="block rounded-md px-3 py-2 text-sm text-studio-text hover:bg-studio-panelRaised"
          >
            Loyihalar
          </Link>
          <Link
            to="/youtube"
            className="block rounded-md px-3 py-2 text-sm text-studio-text hover:bg-studio-panelRaised"
          >
            YouTube kanallar
          </Link>
        </nav>

        <div className="border-t border-studio-border px-5 py-4">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="label-mono">Kredit</span>
            <span className="font-mono text-sm text-signal-amber">{user?.credits ?? 0}</span>
          </div>
          <p className="truncate text-xs text-studio-muted">{user?.email}</p>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="mt-3 text-xs text-studio-muted underline decoration-dotted hover:text-signal-amber"
          >
            Chiqish
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
