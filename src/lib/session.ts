import { redirect } from "next/navigation";
import { auth } from "@/auth";

export type SessionUser = {
  id: string;
  email: string;
  firstName: string;
};

/** Retourne l'utilisateur connecté ou redirige vers /connexion */
export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/connexion");
  }
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    firstName: session.user.firstName ?? session.user.name ?? "",
  };
}

/** Pour les Server Actions / API — lance une erreur si non authentifié */
export async function getUserOrThrow(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    firstName: session.user.firstName ?? session.user.name ?? "",
  };
}
