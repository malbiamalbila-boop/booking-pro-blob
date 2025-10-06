import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "../db/client";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { randomUUID, createHash } from "crypto";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/sign-in",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const [user] = await db.select().from(users).where(eq(users.email, credentials.email)).limit(1);
        if (!user) return null;
        const hash = createHash("sha256").update(credentials.password).digest("hex");
        if (user.passwordHash && user.passwordHash !== hash) {
          return null;
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
        };
      },
    }),
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (token?.sub) {
        session.user = session.user || {} as any;
        session.user.id = token.sub;
      }
      return session;
    },
    jwt: async ({ token }) => {
      if (!token.sub) {
        token.sub = randomUUID();
      }
      return token;
    },
  },
};
