import { getSignInUrl, getWorkOS } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";

export const GET = async () => {
  const authorizationUrl = await getWorkOS().userManagement.getAuthorizationUrl(
    {
      provider: "authkit",
      clientId: process.env.WORKOS_CLIENT_ID!,
      redirectUri: "http://localhost:3000/workos/callback",
    },
  );
  console.log("authorizationUrl", authorizationUrl);
  const signInUrl = await getSignInUrl({
    // provider: "authkit",
    //     organizationId: "org_01JYEX2XE7EKRVPVDTYP19YA90",
  });
  console.log("signInUrl       ", signInUrl);
  console.log("equal ", signInUrl === authorizationUrl);

  return redirect(authorizationUrl);
};
