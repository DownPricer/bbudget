import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Bienvenue" };

export default async function OnboardingPage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findFirst({
    where: { id: sessionUser.id },
    select: { firstName: true, onboardingCompleted: true },
  });
  if (!user) redirect("/connexion");
  if (user.onboardingCompleted) redirect("/");

  return <OnboardingWizard firstName={user.firstName} />;
}
