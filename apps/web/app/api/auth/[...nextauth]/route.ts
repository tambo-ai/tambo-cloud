import { env } from "@/lib/env";
import { SupabaseAdapter } from "@/lib/nextauth-supabase-adapter";
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

const handler = NextAuth({
  adapter: SupabaseAdapter(),
  providers: [
    GitHub({
      clientId: env.GITHUB_ID!,
      clientSecret: env.GITHUB_SECRET!,
    }),
    Google({
      clientId: env.GOOGLE_ID!,
      clientSecret: env.GOOGLE_SECRET!,
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        (session.user as any).id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
