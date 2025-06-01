import { Icons } from "@/components/icons"; // Assuming you have a GitHub icon in Icons
import Link from "next/link";

export function GitHubLink({ href, text }: { href: string; text: string }) {
  return (
    <Link
      href={href}
      className="flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 ring-1 ring-inset ring-secondary transition-colors whitespace-nowrap"
      target="_blank"
      rel="noopener noreferrer"
    >
      <Icons.github className="h-4 w-4" />
      <span>{text}</span>
    </Link>
  );
}
