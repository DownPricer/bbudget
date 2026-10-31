import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ListRowProps = {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  value?: ReactNode;
  badge?: string;
  footer?: ReactNode;
  className?: string;
};

export function ListRow({
  icon,
  title,
  subtitle,
  value,
  badge,
  footer,
  className,
}: ListRowProps) {
  return (
    <div
      className={cn(
        "my-2 rounded-[19px] border border-line bg-white p-[15px] shadow-[0_5px_16px_#693c6009]",
        className,
      )}
    >
      <div className="flex items-center gap-[11px]">
        {icon != null ? (
          <div className="grid h-[39px] w-[39px] shrink-0 place-items-center rounded-[13px] bg-pale text-lg">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="block text-[13px] font-bold text-ink">{title}</p>
            {badge ? (
              <span className="shrink-0 rounded-full bg-pale px-2 py-0.5 text-[10px] font-bold text-[#bd5b83]">
                {badge}
              </span>
            ) : null}
          </div>
          {subtitle ? (
            <p className="mt-0.5 block text-[11px] text-muted">{subtitle}</p>
          ) : null}
        </div>
        {value != null ? (
          <span className="whitespace-nowrap font-extrabold tabular-nums text-ink">{value}</span>
        ) : null}
      </div>
      {footer}
    </div>
  );
}
