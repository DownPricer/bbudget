import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Connexion",
};

export default async function ConnexionPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  return (
    <main
      className="scroll-area mx-auto flex h-full max-w-[var(--app-max)] flex-col items-center justify-center overflow-y-auto bg-background px-5 md:rounded-[30px] md:shadow-[0_25px_70px_#60445c22]"
      style={{
        paddingTop: "calc(1.5rem + var(--safe-top))",
        paddingBottom: "calc(1.5rem + var(--safe-bottom))",
      }}
    >
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-[19px] bg-pale text-2xl font-extrabold text-rose-deep">
          B
        </div>
        <h1 className="text-[25px] font-extrabold tracking-[-0.8px] text-ink">Bbudget</h1>
        <p className="max-w-xs text-sm text-muted">Gestion de budget personnel.</p>
      </div>

      <Card className="w-full max-w-sm">
        <LoginForm />
      </Card>
    </main>
  );
}
