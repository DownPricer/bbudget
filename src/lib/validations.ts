import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Adresse e-mail invalide").trim().toLowerCase(),
  password: z.string().min(1, "Mot de passe requis"),
  remember: z.boolean().optional(),
});

export const createUserSchema = z.object({
  email: z.email("Adresse e-mail invalide").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Au moins 8 caractères")
    .regex(/[a-zA-Z]/, "Au moins une lettre")
    .regex(/[0-9]/, "Au moins un chiffre"),
  firstName: z.string().min(1, "Prénom requis").max(50).trim(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
