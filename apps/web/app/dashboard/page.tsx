import { redirect } from "next/navigation";

export default function DashboardRedirect() {
  // Redirect to the dashboard page in the (authed) route group
  // The URL remains the same because route groups don't affect the URL path
  redirect("/dashboard");
}
