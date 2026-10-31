import { cn } from "@/lib/utils";

type StatTileProps = {
  label: string;
  value: string;
  tone?: "default" | "mint" | "lav";
  className?: string;
};

export function StatTile({ label, value, tone = "default", className }: StatTileProps) {
  return (
    <div
      className={cn(
        "rounded-[19px] p-[15px]",
        tone === "mint" && "bg-[#eaf7f1]",
        tone === "lav" && "bg-[#f5ecfa]",
        tone === "default" && "bg-[#f7eaf3]",
        className,
      )}
    >
      <span className="block text-[11px] text-[#8d8291]">{label}</span>
      <span className="block text-[21px] font-extrabold tracking-[-0.5px] tabular-nums text-ink">
        {value}
      </span>
    </div>
  );
}
