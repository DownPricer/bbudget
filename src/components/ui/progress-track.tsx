import { cn } from "@/lib/utils";

type ProgressTrackProps = {
  progress: number;
  color?: string;
  className?: string;
};

export function ProgressTrack({ progress, color = "var(--pink)", className }: ProgressTrackProps) {
  const pct = Math.min(100, Math.max(0, progress * 100));
  return (
    <div className={cn("mt-3 h-1.5 overflow-hidden rounded-[10px] bg-[#f5eff3]", className)}>
      <div
        className="h-full rounded-[10px] transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}
