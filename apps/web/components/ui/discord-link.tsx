import { Icons } from "@/components/icons";
import Link from "next/link";

export function DiscordLink({ href, text }: { href: string; text: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-lg bg-secondary/80 px-3 py-2 text-sm font-medium text-secondary-foreground ring-1 ring-inset ring-secondary hover:bg-secondary/90 transition-colors whitespace-nowrap"
      target="_blank"
      rel="noopener noreferrer"
    >
      <Icons.discord className="h-4 w-4" />
      <span>{text}</span>
    </Link>
  );
}
