export type StageState = "pending" | "active" | "done" | "failed";

export interface PipelineStage {
  key: string;
  label: string;
  state: StageState;
}

const STATE_DOT: Record<StageState, string> = {
  pending: "bg-studio-border",
  active: "bg-signal-amber shadow-[0_0_10px_2px_rgba(242,169,59,0.6)] animate-pulse",
  done: "bg-signal-teal shadow-[0_0_8px_1px_rgba(79,209,197,0.5)]",
  failed: "bg-signal-red shadow-[0_0_8px_1px_rgba(229,72,77,0.5)]",
};

const STATE_LINE: Record<StageState, string> = {
  pending: "bg-studio-border",
  active: "bg-signal-amber/50",
  done: "bg-signal-teal/60",
  failed: "bg-signal-red/50",
};

const STATE_TEXT: Record<StageState, string> = {
  pending: "text-studio-muted",
  active: "text-signal-amber",
  done: "text-signal-teal",
  failed: "text-signal-red",
};

export function PipelineRail({ stages }: { stages: PipelineStage[] }) {
  return (
    <div className="panel overflow-x-auto p-5">
      <div className="flex min-w-max items-center">
        {stages.map((stage, i) => (
          <div key={stage.key} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${STATE_DOT[stage.state]}`} />
              <span className={`label-mono whitespace-nowrap ${STATE_TEXT[stage.state]}`}>
                {stage.label}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div className={`mx-3 h-px w-10 ${STATE_LINE[stage.state]}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
