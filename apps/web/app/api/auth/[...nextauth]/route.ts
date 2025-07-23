import { env } from "@/lib/env";
import { SupabaseAdapter } from "@/lib/nextauth-supabase-adapter";
import NextAuth, { NextAuthOptions } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter(),
  providers: [
    GitHub({
      clientId: env.GITHUB_CLIENT_ID!,
      clientSecret: env.GITHUB_CLIENT_SECRET!,
    }),
    Google({
      clientId: env.GOOGLE_CLIENT_ID!,
      clientSecret: env.GOOGLE_CLIENT_SECRET!,
      idToken: true,
      authorization: {
        params: {
          prompt: "consent", // force refresh_token on every login
          access_type: "offline", // ask for a refresh_token
          response_type: "code",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  jwt: {
    // encode: async ({ secret, token }) => {
    //   console.log("AUTH ADAPTER: jwt encode with", secret, token);
    //   return token;
    // },
    // decode: async ({ secret, token }) => {
    //   console.log("AUTH ADAPTER: jwt decode with", secret, token);
    //   return token;
  },
  callbacks: {
    async jwt({ token, account, user }) {
      console.log("AUTH ADAPTER: jwt callback with", token, account, user);
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
        token.idToken = account.id_token;
      }
      // Add user ID to token
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token, user }) {
      console.log("AUTH ADAPTER: session callback with", session, token);
      if (user) {
        session.user = user;
      } else if (token) {
        session.user = token;
        session.accessToken = token.accessToken;
        session.provider = token.provider;
      }
      // if (session.user) {
      //   (session.user as any).id = token.id;
      //   // Include access token in session
      //   (session as any).accessToken = token.accessToken;
      //   (session as any).provider = token.provider;
      // }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
