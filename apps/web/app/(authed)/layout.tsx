import { getServerSupabaseclient } from "@/server/supabase";
import { AuthedLayoutWrapper } from "../../components/auth/authed-layout-wrapper";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("AuthedLayout");
  // Check authentication on the server
  const _supabase = await getServerSupabaseclient();
  const {
    data: { user },
  } = await _supabase.auth.getUser();

  console.log("workos user", user);
  return (
    <AuthedLayoutWrapper hasSession={!!user}>{children}</AuthedLayoutWrapper>
  );
}
