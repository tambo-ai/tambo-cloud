import { redirect } from "next/navigation";

export default function Layout() {
  redirect(process.env.NEXT_PUBLIC_DOCS_URL || "https://docs.tambo.co");
}
