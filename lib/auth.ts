import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") return null;

        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
        if (!user?.passwordHash || !user.active) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role, mustChangePassword: user.mustChangePassword };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.mustChangePassword = user.mustChangePassword ?? false;
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => {});
      }
      if (trigger === "update") {
        token.mustChangePassword = false;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "CLIENT" | "ADMIN";
        session.user.mustChangePassword = token.mustChangePassword as boolean;
      }
      return session;
    }
  }
});
