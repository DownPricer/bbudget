import { SettingsForm } from "@/components/settings/settings-form";
import { BackHeader } from "@/components/ui/back-header";
import { getDashboardBudget } from "@/lib/budget/queries";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";

export const metadata = { title: "Réglages" };

export default async function ReglagesPage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findFirst({ where: { id: sessionUser.id } });
  if (!user) redirect("/connexion");
  const { summary } = await getDashboardBudget(user.id);

  return (
    <div>
      <BackHeader href="/plus" eyebrow="Profil et budget" title="Réglages" />
      <div className="mt-5">
        <SettingsForm
          initial={{
            firstName: user.firstName,
            budgetMonthStartDay: user.budgetMonthStartDay,
            pleasurePercent: user.pleasurePercent,
            savingsPercent: user.savingsPercent,
            debtBonusPercent: user.debtBonusPercent,
            currentBalance: summary.currentBalance,
          }}
        />
      </div>
    </div>
  );
}
