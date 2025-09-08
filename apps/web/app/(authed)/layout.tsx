import { NextAuthLayoutWrapper } from "@/components/auth/nextauth-layout-wrapper";
import { HydrateClient, trpc } from "@/server/api/root";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await trpc.user.hasAcceptedLegal.prefetch();
  await trpc.user.getUser.prefetch();
  return (
    <HydrateClient>
      <NextAuthLayoutWrapper>{children}</NextAuthLayoutWrapper>
    </HydrateClient>
  );
}
