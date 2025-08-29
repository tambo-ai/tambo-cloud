import { authOptions } from "@/lib/auth";
import { autumnHandler } from "autumn-js/backend";
import { getServerSession, User } from "next-auth";

export const autumnHandlerMiddleware = async (request: Request) => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body = null;
  if (request.method !== "GET") {
    body = await request.json().catch(() => null);
  }

  const { statusCode, response } = await autumnHandler({
    customerId: (session.user as User).id,
    customerData: {
      name: session.user.name || "",
      email: session.user.email || "",
    },
    request: {
      url: request.url,
      method: request.method,
      body: body,
    },
  });

  return Response.json(response, { status: statusCode });
};
