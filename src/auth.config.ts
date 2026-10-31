import type { NextAuthConfig } from "next-auth";

/**
 * Config légère utilisable côté Edge / proxy (sans Prisma ni bcrypt).
 */
export const authConfig = {
  pages: {
    signIn: "/connexion",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      // Les API gèrent l’auth elles-mêmes (401 JSON) — pas de redirect HTML.
      if (path.startsWith("/api/") && !path.startsWith("/api/auth")) {
        return true;
      }

      const isAuthPage =
        path.startsWith("/connexion") || path.startsWith("/api/auth");

      if (isAuthPage) {
        if (isLoggedIn && path.startsWith("/connexion")) {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      if (!isLoggedIn) {
        return false;
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.firstName = (token.firstName as string) ?? "";
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
} satisfies NextAuthConfig;
