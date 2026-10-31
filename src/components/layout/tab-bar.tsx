"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Accueil", icon: "⌂" },
  { href: "/depenses", label: "Dépenses", icon: "▤" },
  { href: "/coups-de-coeur", label: "Coup de cœur", icon: "♡" },
  { href: "/dettes-epargne", label: "Dettes & épargne", icon: "♧" },
  { href: "/plus", label: "Plus", icon: "•••" },
] as const;

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-40 flex h-[var(--tab-bar-height)] w-full max-w-[var(--app-max)] -translate-x-1/2 justify-around border-t border-line bg-[#fffdfdf0] px-1 pt-2.5 backdrop-blur-[12px]"
      style={{ paddingBottom: "max(10px, var(--safe-bottom))" }}
      aria-label="Navigation principale"
    >
      {tabs.map(({ href, label, icon }) => {
        const active =
          href === "/"
            ? pathname === "/"
            : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "grid min-h-11 min-w-[60px] place-items-center gap-0.5 text-[9px] touch-target",
              active ? "font-extrabold text-pink" : "text-[#a295a4]",
            )}
          >
            <span
              className={cn(
                "text-[19px] leading-none",
                active && "rounded-[9px] bg-pale px-2",
              )}
              aria-hidden
            >
              {icon}
            </span>
            <span className="truncate px-0.5">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
