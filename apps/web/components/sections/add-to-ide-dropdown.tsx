"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Code2 } from "lucide-react";
import Link from "next/link";

export function AddToIdeDropdown() {
  const handleCursorClick = () => {
    //deeplink to install MCP in Cursor
    window.location.href = `${process.env.NEXT_PUBLIC_CURSOR_MCP_DEEPLINK}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-700 max-w-fit shadow-sm hover:shadow-md transition-shadow duration-300"
        >
          <Code2 className="h-4 w-4" />
          Add to IDE
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto">
        <DropdownMenuItem
          onClick={handleCursorClick}
          className="cursor-pointer"
        >
          <span>Cursor</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <Link
            href="/docs/integrations#tab-vscode"
            className="flex items-center justify-between"
          >
            <span>VS Code</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link
            href="/docs/integrations#tab-claude"
            className="flex items-center justify-between"
          >
            <span>Claude (Desktop)</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link
            href="/docs/integrations#tab-windsurf"
            className="flex items-center justify-between"
          >
            <span>Windsurf</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link
            href="/docs/integrations#tab-zed"
            className="flex items-center justify-between"
          >
            <span>Zed</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
