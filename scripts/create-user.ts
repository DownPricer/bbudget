/**
 * Crée un compte utilisateur en ligne de commande.
 * Usage : npm run create-user -- email@exemple.com MotDePasse1 Prénom
 */
import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { createUserSchema } from "../src/lib/validations";

const prisma = new PrismaClient();

async function main() {
  const [, , emailArg, passwordArg, firstNameArg] = process.argv;

  if (!emailArg || !passwordArg || !firstNameArg) {
    console.error("Usage : npm run create-user -- <email> <mot-de-passe> <prénom>");
    process.exit(1);
  }

  const parsed = createUserSchema.safeParse({
    email: emailArg,
    password: passwordArg,
    firstName: firstNameArg,
  });

  if (!parsed.success) {
    console.error("Données invalides :");
    for (const issue of parsed.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existing) {
    console.error(`Un compte existe déjà pour ${parsed.data.email}`);
    process.exit(1);
  }

  const passwordHash = await hash(parsed.data.password, 12);

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      firstName: parsed.data.firstName,
    },
  });

  console.log(`✅ Compte créé : ${user.firstName} <${user.email}> (id: ${user.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
