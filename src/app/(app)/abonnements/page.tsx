import { SubscriptionList } from "@/components/subscriptions/subscription-list";
import { BackHeader } from "@/components/ui/back-header";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { toNumber } from "@/lib/utils";

export const metadata = { title: "Abonnements" };

export default async function AbonnementsPage() {
  const user = await requireUser();
  const subscriptions = await prisma.subscription.findMany({
    where: { userId: user.id },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <BackHeader href="/plus" eyebrow="Frais fixes & prélèvements" title="Abonnements" />
      <SubscriptionList
        subscriptions={subscriptions.map((s) => ({
          id: s.id,
          name: s.name,
          amount: toNumber(s.amount),
          frequency: s.frequency,
          billingDay: s.billingDay,
          category: s.category,
          status: s.status,
        }))}
      />
    </div>
  );
}
