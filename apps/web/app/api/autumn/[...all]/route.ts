import { autumnHandler } from "autumn-js/next";
import { getServerSession, User } from "next-auth";
import { authOptions } from "@/lib/auth";

export const { GET, POST } = autumnHandler({
  identify: async () => {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return null;
    }

    return {
      customerId: (session.user as User).id,
      customerData: {
        name: session.user.name || "",
        email: session.user.email || "",
      },
    };
  },
});
