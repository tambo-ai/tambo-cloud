import { createClient } from "@supabase/supabase-js";
import { Adapter, AdapterSession, AdapterUser } from "next-auth/adapters";
import { env } from "./env";

// Type definitions for the adapter
interface CreateUserData {
  id?: string;
  email: string;
  name?: string;
  image?: string;
}

interface UpdateUserData {
  id: string;
  email?: string;
  name?: string | null;
  image?: string | null;
}

interface LinkAccountData {
  userId: string;
  provider: string;
  providerAccountId: string;
  access_token?: string;
  expires_at?: number;
  refresh_token?: string;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
}

interface UnlinkAccountData {
  provider: string;
  providerAccountId: string;
}

// Create Supabase client with service role key for direct database access
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

export function SupabaseAdapter(): Adapter {
  return {
    async createUser(data: CreateUserData) {
      const { data: user, error } = await supabase
        .from("auth.users")
        .insert({
          id: data.id || crypto.randomUUID(),
          email: data.email,
          email_confirmed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          raw_user_meta_data: data.name ? { name: data.name } : {},
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: user.id,
        email: user.email,
        name: user.raw_user_meta_data?.name,
        image: user.raw_user_meta_data?.avatar_url,
      } as AdapterUser;
    },

    async getUser(id) {
      const { data: user, error } = await supabase
        .from("auth.users")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !user) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.raw_user_meta_data?.name,
        image: user.raw_user_meta_data?.avatar_url,
      } as AdapterUser;
    },

    async getUserByEmail(email) {
      const { data: user, error } = await supabase
        .from("auth.users")
        .select("*")
        .eq("email", email)
        .single();

      if (error || !user) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.raw_user_meta_data?.name,
        image: user.raw_user_meta_data?.avatar_url,
      } as AdapterUser;
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const { data: identity, error } = await supabase
        .from("auth.identities")
        .select("user_id, identity_data")
        .eq("provider", provider)
        .eq("provider_id", providerAccountId)
        .single();

      if (error || !identity) return null;

      const { data: user, error: userError } = await supabase
        .from("auth.users")
        .select("*")
        .eq("id", identity.user_id)
        .single();

      if (userError || !user) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.raw_user_meta_data?.name,
        image: user.raw_user_meta_data?.avatar_url,
      } as AdapterUser;
    },

    async updateUser(data: UpdateUserData) {
      const { data: user, error } = await supabase
        .from("auth.users")
        .update({
          email: data.email,
          raw_user_meta_data: data.name ? { name: data.name } : {},
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: user.id,
        email: user.email,
        name: user.raw_user_meta_data?.name,
        image: user.raw_user_meta_data?.avatar_url,
      } as AdapterUser;
    },

    async deleteUser(userId) {
      const { error } = await supabase
        .from("auth.users")
        .delete()
        .eq("id", userId);

      if (error) throw error;
    },

    async linkAccount(data: LinkAccountData) {
      const { error } = await supabase.from("auth.identities").insert({
        id: crypto.randomUUID(),
        user_id: data.userId,
        provider: data.provider,
        provider_id: data.providerAccountId,
        identity_data: {
          access_token: data.access_token,
          expires_at: data.expires_at,
          refresh_token: data.refresh_token,
          token_type: data.token_type,
          scope: data.scope,
          id_token: data.id_token,
          session_state: data.session_state,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
    },

    async unlinkAccount({ provider, providerAccountId }: UnlinkAccountData) {
      const { error } = await supabase
        .from("auth.identities")
        .delete()
        .eq("provider", provider)
        .eq("provider_id", providerAccountId);

      if (error) throw error;
    },

    async createSession(data) {
      const { data: session, error } = await supabase
        .from("auth.sessions")
        .insert({
          id: data.sessionToken,
          user_id: data.userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return {
        sessionToken: session.id,
        userId: session.user_id,
        expires: data.expires,
      } as AdapterSession;
    },

    async getSessionAndUser(sessionToken) {
      const { data: session, error: sessionError } = await supabase
        .from("auth.sessions")
        .select("*")
        .eq("id", sessionToken)
        .single();

      if (sessionError || !session) return null;

      const { data: user, error: userError } = await supabase
        .from("auth.users")
        .select("*")
        .eq("id", session.user_id)
        .single();

      if (userError || !user) return null;

      return {
        session: {
          sessionToken: session.id,
          userId: session.user_id,
          expires:
            session.not_after || new Date(Date.now() + 24 * 60 * 60 * 1000), // Default 24h
        } as AdapterSession,
        user: {
          id: user.id,
          email: user.email,
          name: user.raw_user_meta_data?.name,
          image: user.raw_user_meta_data?.avatar_url,
        } as AdapterUser,
      };
    },

    async updateSession(data) {
      const { data: session, error } = await supabase
        .from("auth.sessions")
        .update({
          updated_at: new Date().toISOString(),
          not_after: data.expires,
        })
        .eq("id", data.sessionToken)
        .select()
        .single();

      if (error) throw error;

      return {
        sessionToken: session.id,
        userId: session.user_id,
        expires: data.expires,
      } as AdapterSession;
    },

    async deleteSession(sessionToken) {
      const { error } = await supabase
        .from("auth.sessions")
        .delete()
        .eq("id", sessionToken);

      if (error) throw error;
    },

    async createVerificationToken(data) {
      // This would typically use the one_time_tokens table
      // For simplicity, we'll skip this for now
      return data;
    },

    async useVerificationToken({ identifier, token }) {
      // This would typically use the one_time_tokens table
      // For simplicity, we'll skip this for now
      return null;
    },
  };
}
