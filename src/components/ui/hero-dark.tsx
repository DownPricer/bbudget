import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type HeroDarkProps = {
  label: string;
  value: string;
  hint?: string;
  className?: string;
  children?: ReactNode;
};

export function HeroDark({ label, value, hint, className, children }: HeroDarkProps) {
  return (
    <div
      className={cn(
        "my-[22px] mb-4 rounded-[23px] bg-hero px-5 py-5 text-white shadow-[0_12px_28px_#30283d25]",
        className,
      )}
    >
      <p className="text-xs text-[#e3d7e4]">{label}</p>
      <p className="my-1 text-[34px] font-extrabold tracking-[-1.3px] tabular-nums leading-none">
        {value}
      </p>
      {hint ? <p className="m-0 text-xs text-[#e3d7e4]">{hint}</p> : null}
      {children}
    </div>
  );
}
