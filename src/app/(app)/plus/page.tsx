import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Plus" };

const manage = [
  { href: "/rentrees", label: "Rentrées", icon: "€" },
  { href: "/enveloppes", label: "Enveloppes", icon: "◇" },
  { href: "/abonnements", label: "Abonnements", icon: "▣" },
] as const;

const retrospect = [
  { href: "/bilan", label: "Bilan du mois", icon: "◉" },
  { href: "/astuces", label: "Astuces & défis", icon: "✦" },
] as const;

const appLinks = [{ href: "/reglages", label: "Réglages", icon: "⚙" }] as const;

function MenuSection({
  title,
  items,
}: {
  title: string;
  items: ReadonlyArray<{ href: string; label: string; icon: string }>;
}) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-base font-bold text-ink">{title}</h2>
      <Card className="space-y-0 p-1">
        {items.map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            className={`touch-target flex min-h-11 w-full items-center gap-3 px-2 py-3.5 text-left text-ink ${
              i < items.length - 1 ? "border-b border-[#f6eff3]" : ""
            }`}
          >
            <span className="grid h-8 w-8 place-items-center text-base" aria-hidden>
              {item.icon}
            </span>
            <span className="flex-1 text-sm font-semibold">{item.label}</span>
            <span className="text-muted">›</span>
          </Link>
        ))}
      </Card>
    </section>
  );
}

export default async function PlusPage() {
  const user = await requireUser();
  const initial = (user.firstName?.[0] ?? "B").toUpperCase();

  return (
    <div>
      <PageTitle eyebrow="Mon espace" title="Plus" />

      <Card className="mt-5 flex items-center gap-3">
        <div className="grid h-[39px] w-[39px] place-items-center rounded-[13px] bg-pale text-sm font-bold text-rose-deep">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-ink">{user.firstName}</p>
          <p className="mt-0.5 text-[11px] text-muted">{user.email}</p>
        </div>
        <span className="text-muted">›</span>
      </Card>

      <MenuSection title="Gérer mon budget" items={manage} />
      <MenuSection title="Prendre du recul" items={retrospect} />
      <MenuSection title="Application" items={appLinks} />

      <LogoutButton />
    </div>
  );
}
