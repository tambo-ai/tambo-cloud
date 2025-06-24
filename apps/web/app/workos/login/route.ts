import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";

export const GET = async () => {
  const signInUrl = await getSignInUrl({
    organizationId: "org_01JYEX2XE7EKRVPVDTYP19YA90",
  });
  console.log("signInUrl", signInUrl);

  return redirect(signInUrl);
};
