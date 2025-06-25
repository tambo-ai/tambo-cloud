import { signOut } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";

export const GET = async () => {
  console.log("signOut");
  await signOut();
  console.log("redirecting to /");
  return redirect("/");
};
