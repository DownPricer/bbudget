import { ChallengesClient } from "@/components/astuces/challenges-client";
import { BackHeader } from "@/components/ui/back-header";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Astuces & défis" };

export default async function AstucesPage() {
  const user = await requireUser();
  const challenges = await prisma.challenge.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <BackHeader href="/plus" eyebrow="Idées concrètes" title="Astuces & défis" />
      <div className="mt-5">
        <ChallengesClient
          challenges={challenges.map((c) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            durationDays: c.durationDays,
            progressDays: c.progressDays,
            status: c.status,
          }))}
        />
      </div>
    </div>
  );
}
