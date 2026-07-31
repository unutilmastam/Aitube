interface StatusBadgeProps {
  status: string;
  variant?: "amber" | "teal" | "red" | "muted";
}

const VARIANT_CLASSES: Record<string, string> = {
  amber: "bg-signal-amber/15 text-signal-amber border-signal-amber/30",
  teal: "bg-signal-teal/15 text-signal-teal border-signal-teal/30",
  red: "bg-signal-red/15 text-signal-red border-signal-red/30",
  muted: "bg-studio-panelRaised text-studio-muted border-studio-border",
};

export function StatusBadge({ status, variant = "muted" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wide ${VARIANT_CLASSES[variant]}`}
    >
      {status}
    </span>
  );
}
