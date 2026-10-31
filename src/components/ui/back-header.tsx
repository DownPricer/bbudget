import Link from "next/link";
import type { ReactNode } from "react";

type BackHeaderProps = {
  href: string;
  eyebrow?: string;
  title: string;
  right?: ReactNode;
};

export function BackHeader({ href, eyebrow, title, right }: BackHeaderProps) {
  return (
    <div className="flex items-center gap-[11px]">
      <Link
        href={href}
        className="touch-target grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-white text-[22px] leading-none text-pink"
        aria-label="Retour"
      >
        ‹
      </Link>
      <div className="min-w-0 flex-1">
        {eyebrow ? <p className="mb-0.5 text-xs text-muted">{eyebrow}</p> : null}
        <h1 className="m-0 text-[25px] font-extrabold tracking-[-0.8px] text-ink">{title}</h1>
      </div>
      {right}
    </div>
  );
}
