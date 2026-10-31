import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import {
  clearLoginFailures,
  getLoginRateLimitStatus,
  recordLoginFailure,
} from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validations";

/** Erreur Auth.js avec code custom → `result.code` côté client. */
class RateLimitedSignin extends CredentialsSignin {
  code: string;
  constructor(minutesRemaining: number) {
    super();
    this.code = `RATE_LIMITED:${minutesRemaining}`;
  }
}

function loginKey(ip: string, email: string) {
  return `login:${ip}:${email.toLowerCase()}`;
}

function clientIp(request: Request | undefined): string {
  return (
    request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request?.headers?.get("x-real-ip") ??
    "unknown"
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Mot de passe", type: "password" },
        remember: { label: "Rester connectée", type: "text" },
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse({
          email: credentials?.email,
          password: credentials?.password,
          remember:
            credentials?.remember === "true" || credentials?.remember === true,
        });

        if (!parsed.success) {
          return null;
        }

        const ip = clientIp(request);
        const key = loginKey(ip, parsed.data.email);
        const status = getLoginRateLimitStatus(key, 5);
        if (status.blocked) {
          throw new RateLimitedSignin(status.minutesRemaining);
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user) {
          recordLoginFailure(key, 5);
          return null;
        }

        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) {
          recordLoginFailure(key, 5);
          return null;
        }

        clearLoginFailures(key);

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          name: user.firstName,
        };
      },
    }),
  ],
});
