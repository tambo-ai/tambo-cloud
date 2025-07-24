import { env } from "@/lib/env";
import { SupabaseAdapter } from "@/lib/nextauth-supabase-adapter";
import { refreshOidcToken } from "@tambo-ai-cloud/core";
import { decodeJwt } from "jose";
import NextAuth, { Account, NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

const ProviderConfig = {
  google: {
    clientId: env.GOOGLE_CLIENT_ID!,
    clientSecret: env.GOOGLE_CLIENT_SECRET!,
    idToken: true,
    allowDangerousEmailAccountLinking: true,
    authorization: {
      params: {
        prompt: "consent", // force refresh_token on every login
        access_type: "offline", // ask for a refresh_token
        response_type: "code",
      },
    },
  },
  github: {
    clientId: env.GITHUB_CLIENT_ID!,
    clientSecret: env.GITHUB_CLIENT_SECRET!,
    allowDangerousEmailAccountLinking: true,
  },
};

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter(),
  providers: [GitHub(ProviderConfig.github), Google(ProviderConfig.google)],
  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, account, user }) {
      console.log("AUTH ROUTE: jwt callback with", token, account, user);
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
        token.idToken = account.id_token;
      }

      const refreshedToken = await refreshTokenIfNecessary(account, token);
      // Add user ID to token
      if (user) {
        refreshedToken.id = user.id;
      }
      return refreshedToken;
    },
    async session({ session, token, user }) {
      console.log("AUTH ROUTE: session callback with", session, token, user);
      if (user) {
        session.user = user;
      } else if (token) {
        session.user = token;
      }
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

/**
 * Refresh the token if it is expired, otherwise return the token as is
 * @param account - The account object
 * @param token - The token to refresh
 * @returns The refreshed token
 */
async function refreshTokenIfNecessary(
  account: Account | null,
  token: JWT,
): Promise<JWT> {
  if (!token.idToken) {
    return token;
  }
  const refreshToken = account?.refresh_token;
  const idToken = decodeJwt(token.idToken as string);
  const isExpired = idToken.exp && Date.now() < idToken.exp * 1000;
  const provider =
    ProviderConfig[token.provider as keyof typeof ProviderConfig];
  if (!isExpired || !refreshToken || typeof token.idToken !== "string") {
    // Just leave the token as is - this will likely throw an error somewhere else
    return token;
  }
  const refreshedToken = await refreshOidcToken(
    idToken,
    refreshToken,
    provider.clientId,
    provider.clientSecret,
  );
  return {
    ...token,
    accessToken: refreshedToken.accessToken,
    idToken: refreshedToken.idToken,
    refreshToken: refreshedToken.refreshToken,
    expiresAt: refreshedToken.expiresAt,
    scope: refreshedToken.scope,
    tokenType: refreshedToken.tokenType,
  };
}
