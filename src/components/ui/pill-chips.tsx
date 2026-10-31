import Link from "next/link";
import { cn } from "@/lib/utils";

export type Pill = {
  label: string;
  href: string;
  active?: boolean;
};

export function PillChips({ pills }: { pills: Pill[] }) {
  return (
    <div className="scrollbar-hide my-3 flex max-w-full gap-[7px] overflow-x-auto">
      {pills.map((p) => (
        <Link
          key={p.href + p.label}
          href={p.href}
          className={cn(
            "touch-target inline-flex min-h-11 shrink-0 items-center rounded-full border px-[11px] text-sm whitespace-nowrap",
            p.active
              ? "border-[#e9abc3] bg-pale font-bold text-[#bd5b83]"
              : "border-line bg-white text-[#756b7b]",
          )}
        >
          {p.label}
        </Link>
      ))}
    </div>
  );
}
