import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import { prisma } from "@/lib/prisma";
import { routing } from "@/i18n/routing";

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: `/${routing.defaultLocale}/login`,
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: { carrier: true },
        });
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          carrierId: user.carrier?.id ?? null,
          carrierStatus: user.carrier?.status ?? null,
        };
      },
    }),
    Google,
    // Temporary stand-in for real Google OAuth: no AUTH_GOOGLE_ID/SECRET
    // required, so the carrier Google-signup flow can be demoed end to end.
    // Swap the button back to signIn("google", ...) once real credentials
    // are configured, then delete this provider.
    Credentials({
      id: "google-mock",
      name: "Google (mock)",
      credentials: {
        email: { label: "Email", type: "email" },
        name: { label: "Name", type: "text" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const name = credentials?.name;
        if (typeof email !== "string") return null;
        const lower = email.toLowerCase();

        const existing = await prisma.user.findUnique({
          where: { email: lower },
          include: { carrier: true },
        });

        if (existing) {
          // Mirrors the real Google signIn callback: this mock flow only
          // creates/logs in carrier accounts.
          if (existing.role !== "CARRIER") return null;
          return {
            id: existing.id,
            email: existing.email,
            name: existing.name,
            role: existing.role,
            carrierId: existing.carrier?.id ?? null,
            carrierStatus: existing.carrier?.status ?? null,
          };
        }

        const created = await prisma.user.create({
          data: {
            email: lower,
            name: typeof name === "string" ? name : undefined,
            role: "CARRIER",
          },
        });
        return {
          id: created.id,
          email: created.email,
          name: created.name,
          role: created.role,
          carrierId: null,
          carrierStatus: null,
        };
      },
    }),
  ],
  callbacks: {
    signIn: async ({ user, account }) => {
      if (account?.provider !== "google") return true;

      const email = user.email?.toLowerCase();
      if (!email) return false;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        // Google sign-in is only for carrier accounts; a client account with
        // this email must keep using email/password login.
        return existing.role === "CARRIER";
      }

      await prisma.user.create({
        data: {
          email,
          name: user.name,
          image: user.image,
          role: "CARRIER",
        },
      });
      return true;
    },
    jwt: async ({ token, user, account, trigger }) => {
      if (account?.provider === "google" && user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
          include: { carrier: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.carrierId = dbUser.carrier?.id ?? null;
          token.carrierStatus = dbUser.carrier?.status ?? null;
        }
        return token;
      }

      if (user) {
        token.id = user.id as string;
        token.role = user.role as NonNullable<typeof user.role>;
        token.carrierId = user.carrierId ?? null;
        token.carrierStatus = user.carrierStatus ?? null;
        return token;
      }

      if (trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          include: { carrier: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.carrierId = dbUser.carrier?.id ?? null;
          token.carrierStatus = dbUser.carrier?.status ?? null;
        }
      }

      return token;
    },
    session: async ({ session, token }) => {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.carrierId = token.carrierId;
      session.user.carrierStatus = token.carrierStatus;
      return session;
    },
  },
};
