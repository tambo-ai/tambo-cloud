import { getServerSupabaseclient } from "@/server/supabase";
import { redirect } from "next/navigation";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication on the server
  const supabase = await getServerSupabaseclient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If user is not authenticated, redirect to login page with returnUrl
  if (!session) {
    redirect(`/login?returnUrl=${encodeURIComponent("/dashboard")}`);
  }

  return <>{children}</>;
}
