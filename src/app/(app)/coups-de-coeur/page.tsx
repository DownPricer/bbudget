import { WishListClient } from "@/components/wishes/wish-list-client";
import { PageTitle } from "@/components/ui/page-title";
import { getDashboardBudget } from "@/lib/budget/queries";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { toNumber } from "@/lib/utils";

export const metadata = { title: "Coup de cœur" };

export default async function CoupsDeCoeurPage() {
  const user = await requireUser();
  const [{ summary }, wishes, envelopes] = await Promise.all([
    getDashboardBudget(user.id),
    prisma.wishItem.findMany({
      where: { userId: user.id },
      include: { envelope: true },
      orderBy: { addedAt: "desc" },
    }),
    prisma.envelope.findMany({
      where: { userId: user.id, type: "PLAISIR" },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const spentMap = new Map(summary.envelopes.map((e) => [e.id, e]));
  const savedTotal = wishes
    .filter((w) => w.status === "ABANDONNE")
    .reduce((s, w) => s + toNumber(w.price), 0);

  return (
    <div>
      <PageTitle eyebrow="Règle des 48 h" title="Coup de cœur" />
      <WishListClient
        savedTotal={savedTotal}
        envelopes={envelopes.map((e) => ({
          id: e.id,
          name: e.name,
          emoji: e.emoji,
        }))}
        wishes={wishes.map((w) => {
          const env = w.envelopeId ? spentMap.get(w.envelopeId) : undefined;
          return {
            id: w.id,
            name: w.name,
            price: toNumber(w.price),
            link: w.link,
            photoUrl: w.photoUrl,
            envelopeId: w.envelopeId,
            envelopeName: w.envelope?.name,
            envelopeBudget: env?.monthlyAmount ?? null,
            envelopeSpent: env?.spent ?? null,
            addedAt: w.addedAt.toISOString(),
            status: w.status,
          };
        })}
      />
    </div>
  );
}
