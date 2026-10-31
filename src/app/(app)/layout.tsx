import { redirect } from "next/navigation";
import { TabBar } from "@/components/layout/tab-bar";
import { QuickAddProvider } from "@/components/quick-add/quick-add-provider";
import { InstallBanner } from "@/components/pwa/install-banner";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const dbUser = await prisma.user.findFirst({
    where: { id: user.id },
    select: { onboardingCompleted: true },
  });
  if (dbUser && !dbUser.onboardingCompleted) {
    redirect("/onboarding");
  }

  const envelopes = await prisma.envelope.findMany({
    where: { userId: user.id, type: "PLAISIR" },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, emoji: true, color: true },
  });

  return (
    <QuickAddProvider envelopes={envelopes}>
      <div className="relative mx-auto flex h-full max-h-dvh w-full max-w-[var(--app-max)] flex-col overflow-hidden bg-background md:rounded-[30px] md:shadow-[0_25px_70px_#60445c22]">
        <InstallBanner />
        <main
          className="scroll-area min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-[18px]"
          style={{
            paddingTop: "calc(22px + var(--safe-top))",
            paddingBottom: "calc(var(--tab-bar-height) + var(--safe-bottom) + 16px)",
          }}
        >
          {children}
        </main>
        <TabBar />
      </div>
    </QuickAddProvider>
  );
}
