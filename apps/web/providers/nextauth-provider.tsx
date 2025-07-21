"use client";

import { SessionProvider } from "next-auth/react";
import { type ReactNode } from "react";

interface NextAuthProviderProps {
  children: ReactNode;
}

export function NextAuthProvider({ children }: NextAuthProviderProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
